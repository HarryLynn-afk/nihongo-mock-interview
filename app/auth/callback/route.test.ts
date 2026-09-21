import { afterEach, describe, expect, it, vi } from "vitest";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";
import { CONSENT_GATE_COOKIE } from "@/lib/content/studyAuth";

const ORIGINAL_ENV = { ...process.env };

const {
  getUser,
  signOut,
  exchangeCodeForSession,
  invitedMaybeSingle,
  participantMaybeSingle,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  invitedMaybeSingle: vi.fn(),
  participantMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: vi.fn(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    return {
      auth: { getUser, signOut, exchangeCodeForSession },
    };
  }),
}));

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient: () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle:
              table === "participants" ? participantMaybeSingle : invitedMaybeSingle,
          }),
        }),
      }),
    };
  },
}));

describe("GET /auth/callback", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    getUser.mockReset();
    signOut.mockReset();
    exchangeCodeForSession.mockReset();
    invitedMaybeSingle.mockReset();
    participantMaybeSingle.mockReset();
  });

  it("sends hash-only invite clicks to /auth/continue instead of /consent", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost:3000/auth/callback"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/auth/continue");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).not.toContain(`${CONSENT_GATE_COOKIE}=ok`);
  });

  it("keeps join from on the callback so consent can claim the slot", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?from=T1"),
    );
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${JOIN_FROM_COOKIE}=T1`);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("signs out /login Google when the email is not in invited_emails", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "stranger@gmail.com" } },
    });
    participantMaybeSingle.mockResolvedValue({ data: null, error: null });
    invitedMaybeSingle.mockResolvedValue({ data: null, error: null });
    signOut.mockResolvedValue({ error: null });
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=pkce"),
    );
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=not_invited",
    );
    expect(signOut).toHaveBeenCalled();
  });

  it("lets allowlisted /login Google reach consent", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@gmail.com" } },
    });
    participantMaybeSingle.mockResolvedValue({ data: null, error: null });
    invitedMaybeSingle.mockResolvedValue({
      data: { email: "tester@gmail.com" },
      error: null,
    });
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=pkce"),
    );
    expect(res.headers.get("location")).toBe("http://localhost:3000/consent");
    expect(signOut).not.toHaveBeenCalled();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${CONSENT_GATE_COOKIE}=ok`);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });
});
