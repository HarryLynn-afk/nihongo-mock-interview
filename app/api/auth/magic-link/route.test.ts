import { describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const { signInWithOtp } = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
}));

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { email: "tester@school.org" },
            error: null,
          }),
        }),
      }),
    }),
  }),
  createStudyAnonClient: () => ({
    auth: { signInWithOtp },
  }),
}));

describe("POST /api/auth/magic-link", () => {
  it("fails closed without sending a sign-in link", async () => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    signInWithOtp.mockReset();

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "tester@school.org" }),
      }),
    );
    const body = (await res.json()) as { error?: string };
    expect(res.status).toBe(410);
    expect(body.error).toBe("gone");
    expect(signInWithOtp).not.toHaveBeenCalled();
    process.env = { ...ORIGINAL_ENV };
  });
});
