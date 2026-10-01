import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient, signOut, lookupJoinLink, cookieValues } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  signOut: vi.fn(),
  lookupJoinLink: vi.fn(),
  cookieValues: {} as Record<string, string>,
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("@/lib/server/study/lookupJoinLink", () => ({ lookupJoinLink }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: (name: string) => cookieValues[name] ? { value: cookieValues[name] } : undefined,
    set: vi.fn(),
  }),
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    signOut.mockResolvedValue({ error: null });
    createServerClient.mockReturnValue({ auth: { signOut } });
    lookupJoinLink.mockReset();
    for (const key of Object.keys(cookieValues)) delete cookieValues[key];
  });

  it("returns to this device's invite link while it is still open", async () => {
    cookieValues.nihongo_device_invite = "T1";
    lookupJoinLink.mockResolvedValue({ signupCount: 0, maxSignups: 10 });
    const { POST } = await import("./route");

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, destination: "/join?from=T1" });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(lookupJoinLink).toHaveBeenCalledWith("T1");
    for (const name of [
      "nihongo_consent_gate",
      "nihongo_visit_id",
      "nihongo_visit_consented",
      "nihongo_join_from",
    ]) {
      expect(response.cookies.get(name)?.value).toBe("");
    }
  });

  it("keeps this device's invite for the next tester", async () => {
    cookieValues.nihongo_device_invite = "T1";
    lookupJoinLink.mockResolvedValue({ signupCount: 0, maxSignups: 10 });
    const { POST } = await import("./route");

    const response = await POST();

    expect(response.cookies.get("nihongo_device_invite")).toBeUndefined();
  });

  it("goes to the normal landing once the invite is full", async () => {
    cookieValues.nihongo_device_invite = "T1";
    lookupJoinLink.mockResolvedValue({ signupCount: 5, maxSignups: 5 });
    const { POST } = await import("./route");

    const response = await POST();

    expect(await response.json()).toEqual({ ok: true, destination: "/" });
  });

  it("returns normal-link sign-out to the guest landing", async () => {
    const { POST } = await import("./route");

    const response = await POST();

    expect(await response.json()).toEqual({ ok: true, destination: "/" });
    expect(lookupJoinLink).not.toHaveBeenCalled();
  });
});
