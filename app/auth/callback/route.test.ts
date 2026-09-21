import { describe, expect, it, vi } from "vitest";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";

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

  it("keeps join from on the callback so consent can claim the slot", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost:3000/auth/callback?from=T1"),
    );
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${JOIN_FROM_COOKIE}=T1`);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });
});
