import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type Preset = "expensive" | "write" | "auth";
type Handler = (request: Request) => Promise<Response> | Response;

const PRESETS: Record<Preset, { limit: number; windowMs: number }> = {
  expensive: { limit: 20, windowMs: 60_000 },
  write: { limit: 10, windowMs: 60_000 },
  auth: { limit: 8, windowMs: 60_000 },
};

// ponytail: in-memory store, per instance. Without UPSTASH_* env vars this is
// the only store; with them the shared store below takes over.
const hits = new Map<string, number[]>();

const sharedLimiters = new Map<Preset, (key: string) => Promise<boolean>>();

/** Shared store when UPSTASH_REDIS_REST_URL/TOKEN are configured, else null. */
function sharedLimiterFor(preset: Preset) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const cached = sharedLimiters.get(preset);
  if (cached) return cached;
  const { limit, windowMs } = PRESETS[preset];
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
  });
  const check = async (key: string) => (await ratelimit.limit(key)).success;
  sharedLimiters.set(preset, check);
  return check;
}

/** Test-only: clear the window store and cached shared limiters between tests. */
export function __resetGuard() {
  hits.clear();
  sharedLimiters.clear();
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Cross-site defense: browsers always send Origin on POST, so a mismatched
 * origin is rejected. Requests without one (curl, tests) pass and rely on
 * the rate limit instead.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * Wrap a route handler to reject cross-origin calls and rate-limit by IP.
 * `export const POST = withApiGuard(async (request) => {...}, "expensive")`.
 */
export function withApiGuard(
  handler: Handler,
  preset: Preset = "expensive",
): Handler {
  const { limit, windowMs } = PRESETS[preset];

  return async (request) => {
    if (!sameOrigin(request)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const key = `${preset}:${clientIp(request)}`;

    let shared: ((key: string) => Promise<boolean>) | null = null;
    try {
      shared = sharedLimiterFor(preset);
      if (shared && !(await shared(key))) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
      }
    } catch {
      // Store or configuration problems fall through to the per-instance
      // limit; provider spend caps remain the backstop.
      shared = null;
    }
    if (shared) {
      return handler(request);
    }

    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= limit) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    recent.push(now);
    hits.set(key, recent);

    return handler(request);
  };
}
