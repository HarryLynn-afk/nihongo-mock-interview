import { afterEach, describe, expect, it, vi } from "vitest";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";

const ORIGINAL_ENV = { ...process.env };

const { lookupSingle, signInWithOAuth } = vi.hoisted(() => ({
  lookupSingle: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: lookupSingle,
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return { auth: { signInWithOAuth } };
  },
}));

describe("POST /api/auth/join-google", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    lookupSingle.mockReset();
    signInWithOAuth.mockReset();
  });

  it("returns no Google URL when Supabase is unset", async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/join-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "T1" }),
      }),
    );
    const body = (await res.json()) as { url: string | null };
    expect(res.status).toBe(200);
    expect(body.url).toBeNull();
  });

  it("returns the Google URL and an HttpOnly from cookie when the join link is open", async () => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    lookupSingle.mockResolvedValue({
      data: { signup_count: 0, max_signups: 10 },
      error: null,
    });
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/join-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "T1" }),
      }),
    );
    const body = (await res.json()) as { url: string | null };
    expect(body.url).toBe("https://accounts.google.com/oauth");
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: expect.objectContaining({
        queryParams: { prompt: "select_account" },
      }),
    });
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${JOIN_FROM_COOKIE}=T1`);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });
});
