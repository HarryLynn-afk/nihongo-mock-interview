/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";

const { createServerClient, getUser, maybeSingle } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));

const originalEnv = { ...process.env };

describe("participant classroom consent gate", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: { participant_id: "P001" } });
    createServerClient.mockReturnValue({
      auth: { getUser },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects a forged consent cookie even after Google sign-in", async () => {
    const request = new NextRequest("http://localhost/call", {
      headers: {
        cookie:
          "nihongo_consent_gate=ok; nihongo_visit_id=visit-1; nihongo_visit_consented=forged",
      },
    });
    const { middleware } = await import("./middleware");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("allows the signed-in tester after consent for this visit", async () => {
    const proof = createHmac("sha256", "test-secret")
      .update("user-1:visit-1:2026-09-08")
      .digest("base64url");
    const request = new NextRequest("http://localhost/call", {
      headers: {
        cookie: `nihongo_consent_gate=ok; nihongo_visit_id=visit-1; nihongo_visit_consented=${proof}`,
      },
    });
    const { middleware } = await import("./middleware");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("rejects a consented session when its participant record is missing", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const proof = createHmac("sha256", "test-secret")
      .update("user-1:visit-1:2026-09-08")
      .digest("base64url");
    const request = new NextRequest("http://localhost/call", {
      headers: {
        cookie: `nihongo_consent_gate=ok; nihongo_visit_id=visit-1; nihongo_visit_consented=${proof}`,
      },
    });
    const { middleware } = await import("./middleware");
    const response = await middleware(request);

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("sends a signed-in tester off a Guest call to the landing", async () => {
    const request = new NextRequest("http://localhost/call?guest=1");
    const { middleware } = await import("./middleware");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("lets an anonymous visitor run the Guest call", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const request = new NextRequest("http://localhost/call?guest=1");
    const { middleware } = await import("./middleware");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
