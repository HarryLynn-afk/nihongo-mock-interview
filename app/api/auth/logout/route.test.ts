import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient, signOut } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: (name: string) =>
      name === "nihongo_join_from" ? { value: "T1" } : undefined,
    set: vi.fn(),
  }),
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    signOut.mockResolvedValue({ error: null });
    createServerClient.mockReturnValue({ auth: { signOut } });
  });

  it("ends the Google session and clears the visit and pending join", async () => {
    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, destination: "/join?from=T1" });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    for (const name of [
      "nihongo_consent_gate",
      "nihongo_visit_id",
      "nihongo_visit_consented",
      "nihongo_join_from",
    ]) {
      expect(response.cookies.get(name)?.value).toBe("");
    }
  });
});
