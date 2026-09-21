import { afterEach, describe, expect, it, vi } from "vitest";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";
import { CONSENT_GATE_COOKIE } from "@/lib/content/studyAuth";

const ORIGINAL_ENV = { ...process.env };

const { signInWithOAuth, signOut } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return { auth: { signInWithOAuth, signOut } };
  },
}));

describe("POST /api/auth/login-google", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    signInWithOAuth.mockReset();
    signOut.mockReset();
    signOut.mockResolvedValue({ error: null });
  });

  it("returns no Google URL when Supabase is unset", async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/login-google", { method: "POST" }),
    );
    const body = (await res.json()) as { url: string | null };
    expect(res.status).toBe(200);
    expect(body.url).toBeNull();
  });

  it("returns the Google URL, clears a leftover join cookie, and does not set from", async () => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });
    signOut.mockResolvedValue({ error: null });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/login-google", { method: "POST" }),
    );
    const body = (await res.json()) as { url: string | null };
    expect(body.url).toBe("https://accounts.google.com/oauth");
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost/auth/callback",
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(JOIN_FROM_COOKIE);
    expect(setCookie).toContain(CONSENT_GATE_COOKIE);
    expect(setCookie.toLowerCase()).toMatch(/max-age=0/);
    expect(setCookie).not.toMatch(new RegExp(`${JOIN_FROM_COOKIE}=[^;]+`));
  });
});
