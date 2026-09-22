/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CONSENT_GATE_COOKIE } from "@/lib/content/studyAuth";

const ORIGINAL_ENV = { ...process.env };

function request(path: string, cookieHeader?: string) {
  const headers = new Headers();
  if (cookieHeader) headers.set("cookie", cookieHeader);
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("middleware removed pitch URLs", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("sends removed pitch URLs to a page Next can mark not found", async () => {
    const { middleware } = await import("./middleware");
    const landing = await middleware(request("/pitch"));
    const call = await middleware(request("/call?pitch=1"));
    expect(landing.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/pitch",
    );
    expect(call.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/pitch",
    );
    expect(landing.headers.get("location")).toBeNull();
    expect(call.headers.get("location")).toBeNull();
  });

  it("does not redirect a Guest or Participant call", async () => {
    const { middleware } = await import("./middleware");
    const guest = await middleware(request("/call?guest=1"));
    const practice = await middleware(
      request("/call", `${CONSENT_GATE_COOKIE}=ok`),
    );
    expect(guest.headers.get("location")).toBeNull();
    expect(practice.headers.get("location")).toBeNull();
  });
});

describe("middleware visit gate", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("sends leftover /consent visits to /login", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/consent"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(CONSENT_GATE_COOKIE);
    expect(setCookie.toLowerCase()).toMatch(/max-age=0/);
  });

  it("lets /consent through after a fresh sign-in cookie", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(
      request("/consent", `${CONSENT_GATE_COOKIE}=ok`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("sends Participant /call without a visit to /login", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/call"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("lets Participant /call through with a visit cookie", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/call", `${CONSENT_GATE_COOKIE}=ok`));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets /call?guest=1 through without a visit cookie", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/call?guest=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not clear the visit cookie when visiting home", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/", `${CONSENT_GATE_COOKIE}=ok`));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).not.toMatch(
      new RegExp(`${CONSENT_GATE_COOKIE}=;.*max-age=0`, "i"),
    );
  });
});
