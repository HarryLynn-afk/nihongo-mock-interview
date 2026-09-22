/**
 * Route / session matrix — locks the visit policy so one-route patches
 * cannot silently change Guest or Participant entry.
 * Join Google signOut-before-OAuth is also asserted in
 * app/api/auth/join-google/route.test.ts.
 */
/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CONSENT_GATE_COOKIE } from "@/lib/content/studyAuth";
import { mustSignIn, nextAfterAuth } from "@/lib/content/visitPolicy";

const ORIGINAL_ENV = { ...process.env };

function request(path: string, cookieHeader?: string) {
  const headers = new Headers();
  if (cookieHeader) headers.set("cookie", cookieHeader);
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("visit route / session matrix", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("leftover /consent without a visit → /login", async () => {
    expect(mustSignIn("/consent", "", undefined)).toBe(true);
    const { middleware } = await import("../../middleware");
    const res = await middleware(request("/consent"));
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("Participant /call without a visit → /login", async () => {
    expect(mustSignIn("/call", "", undefined)).toBe(true);
    const { middleware } = await import("../../middleware");
    const res = await middleware(request("/call"));
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("Guest /call?guest=1 stays without a visit", async () => {
    expect(mustSignIn("/call", "?guest=1", undefined)).toBe(false);
    const { middleware } = await import("../../middleware");
    const res = await middleware(request("/call?guest=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("old pitch URLs are handed to Next as a missing page", async () => {
    const { middleware } = await import("../../middleware");
    const call = await middleware(request("/call?pitch=1"));
    const landing = await middleware(request("/pitch"));
    expect(call.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/pitch",
    );
    expect(landing.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/pitch",
    );
    expect(call.headers.get("location")).toBeNull();
    expect(landing.headers.get("location")).toBeNull();
  });

  it("home does not drop the visit cookie", async () => {
    const { middleware } = await import("../../middleware");
    const res = await middleware(request("/", `${CONSENT_GATE_COOKIE}=ok`));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).not.toMatch(/nihongo_consent_gate=;.*max-age=0/i);
  });

  it("successful auth goes to /consent; failed join goes back to join", () => {
    expect(nextAfterAuth({ from: null, ok: true })).toBe("/consent");
    expect(nextAfterAuth({ from: "rsu-k7m2", ok: false })).toBe(
      "/join?from=rsu-k7m2",
    );
  });

  it("Participant /call with a visit cookie stays", async () => {
    expect(mustSignIn("/call", "", "ok")).toBe(false);
    const { middleware } = await import("../../middleware");
    const res = await middleware(
      request("/call", `${CONSENT_GATE_COOKIE}=ok`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
