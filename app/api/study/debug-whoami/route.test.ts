import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

describe("GET /api/study/debug-whoami", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    getUser.mockReset();
  });

  it("returns the signed-in email outside production", async () => {
    process.env.NODE_ENV = "development" as typeof process.env.NODE_ENV;
    getUser.mockResolvedValue({ data: { user: { email: "tester@gmail.com" } } });
    const { GET } = await import("./route");

    const res = await GET();
    const body = (await res.json()) as { email: string | null };

    expect(body.email).toBe("tester@gmail.com");
  });

  it("returns null when nobody is signed in", async () => {
    process.env.NODE_ENV = "development" as typeof process.env.NODE_ENV;
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");

    const res = await GET();
    const body = (await res.json()) as { email: string | null };

    expect(body.email).toBeNull();
  });

  it("404s and never queries Supabase in production", async () => {
    process.env.NODE_ENV = "production" as typeof process.env.NODE_ENV;
    const { GET } = await import("./route");

    const res = await GET();
    const body = (await res.json()) as { email: string | null };

    expect(res.status).toBe(404);
    expect(body.email).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });
});
