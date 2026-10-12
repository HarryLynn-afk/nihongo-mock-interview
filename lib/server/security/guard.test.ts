import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetGuard, withApiGuard } from "./guard";

const { fromEnvMock, limitMock, slidingWindowMock } = vi.hoisted(() => ({
  fromEnvMock: vi.fn(() => ({})),
  limitMock: vi.fn(),
  slidingWindowMock: vi.fn(),
}));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = slidingWindowMock;
    limit = limitMock;
  }
  return { Ratelimit };
});

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: fromEnvMock },
}));

function post(headers: Record<string, string>) {
  return new Request("http://localhost/api/x", { method: "POST", headers });
}

const ok = () => new Response("ok", { status: 200 });

beforeEach(() => {
  __resetGuard();
});

describe("withApiGuard", () => {
  it("blocks a cross-origin POST with 403", async () => {
    const guarded = withApiGuard(ok, "expensive");

    const res = await guarded(
      post({ origin: "http://evil.example", "x-forwarded-for": "1.1.1.1" }),
    );

    expect(res.status).toBe(403);
  });

  it("passes a same-origin request through to the handler", async () => {
    const guarded = withApiGuard(ok, "expensive");

    const res = await guarded(
      post({ origin: "http://localhost", "x-forwarded-for": "2.2.2.2" }),
    );

    expect(res.status).toBe(200);
  });

  it("returns 429 once one IP exceeds the window limit", async () => {
    const guarded = withApiGuard(ok, "auth");
    const ip = { origin: "http://localhost", "x-forwarded-for": "3.3.3.3" };

    let last = 0;
    for (let call = 0; call < 9; call += 1) {
      last = (await guarded(post(ip))).status;
    }

    expect(last).toBe(429);
  });
});

describe("withApiGuard with a shared store", () => {
  beforeEach(() => {
    fromEnvMock.mockClear();
    limitMock.mockClear();
    slidingWindowMock.mockClear();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://rate.example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 429 from the shared limit without calling the handler", async () => {
    limitMock.mockResolvedValue({ success: false });
    const handler = vi.fn(ok);
    const guarded = withApiGuard(handler, "expensive");

    const res = await guarded(
      post({ origin: "http://localhost", "x-forwarded-for": "9.9.9.9" }),
    );

    expect(res.status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
    expect(limitMock).toHaveBeenCalledWith("expensive:9.9.9.9");
  });

  it("reaches the handler through the local limit when the shared store errors", async () => {
    limitMock.mockRejectedValue(new Error("upstash down"));
    const handler = vi.fn(ok);
    const guarded = withApiGuard(handler, "expensive");

    const res = await guarded(
      post({ origin: "http://localhost", "x-forwarded-for": "8.8.8.8" }),
    );

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it("runs the handler exactly once when it throws after a shared allow", async () => {
    limitMock.mockResolvedValue({ success: true });
    const handler = vi.fn(() => {
      throw new Error("handler boom");
    });
    const guarded = withApiGuard(handler, "expensive");

    await expect(
      guarded(post({ origin: "http://localhost", "x-forwarded-for": "5.5.5.5" })),
    ).rejects.toThrow("handler boom");

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("uses the local limit when the Redis client cannot be constructed", async () => {
    fromEnvMock.mockImplementationOnce(() => {
      throw new Error("invalid UPSTASH_REDIS_REST_URL");
    });
    const handler = vi.fn(ok);
    const guarded = withApiGuard(handler, "expensive");

    const res = await guarded(
      post({ origin: "http://localhost", "x-forwarded-for": "4.4.4.4" }),
    );

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  // Characterization: slice 1 made the shared path work; this pins the preset mapping.
  it("builds the shared limit from the preset's limit and window", async () => {
    limitMock.mockResolvedValue({ success: true });
    const guarded = withApiGuard(ok, "auth");

    await guarded(post({ origin: "http://localhost", "x-forwarded-for": "7.7.7.7" }));

    expect(slidingWindowMock).toHaveBeenCalledWith(8, "60000 ms");
  });

  it("keeps the local limit when only the URL is configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const handler = vi.fn(ok);
    const guarded = withApiGuard(handler, "expensive");

    const res = await guarded(
      post({ origin: "http://localhost", "x-forwarded-for": "6.6.6.6" }),
    );

    expect(res.status).toBe(200);
    expect(limitMock).not.toHaveBeenCalled();
  });
});
