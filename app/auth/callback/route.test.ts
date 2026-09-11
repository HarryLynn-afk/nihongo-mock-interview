import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: vi.fn(async () => null),
}));

describe("GET /auth/callback", () => {
  it("sends hash-only invite clicks to /auth/continue instead of /consent", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost:3000/auth/callback"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/auth/continue");
  });
});
