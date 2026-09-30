import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient, getUser } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
}));

describe("GET /api/study/auth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createServerClient.mockReturnValue({ auth: { getUser } });
  });

  it("reports a signed-in user", async () => {
    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ signedIn: true });
  });

  it("reports no user when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("./route");
    const res = await GET();

    await expect(res.json()).resolves.toEqual({ signedIn: false });
  });

  it("fails closed when the auth check throws", async () => {
    getUser.mockRejectedValue(new Error("supabase down"));

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ signedIn: false });
  });

  it("reports no user when Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { GET } = await import("./route");
    const res = await GET();

    await expect(res.json()).resolves.toEqual({ signedIn: false });
  });
});
