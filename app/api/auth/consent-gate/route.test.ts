import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_GATE_COOKIE } from "@/lib/content/studyAuth";

const ORIGINAL_ENV = { ...process.env };

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    return { auth: { getUser } };
  },
}));

describe("POST /api/auth/consent-gate", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    getUser.mockReset();
  });

  it("returns 503 when Supabase is unset", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(503);
  });

  it("returns 401 when there is no signed-in user", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    };
    getUser.mockResolvedValue({ data: { user: null } });
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("sets the HttpOnly consent gate after a hash-session sign-in", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    };
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@gmail.com" } },
    });
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${CONSENT_GATE_COOKIE}=ok`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).not.toMatch(/max-age=/);
  });
});
