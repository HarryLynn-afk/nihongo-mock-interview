import { describe, expect, it, vi } from "vitest";
import { joinPageView, readJoinFrom, startJoinGoogle } from "./joinLink";

describe("joinPageView", () => {
  it("shows Google sign-up when from matches a stored link that still has room", () => {
    const view = joinPageView("T1", { signupCount: 0, maxSignups: 10 });

    expect(view.status).toBe("open");
    expect(view.showGoogle).toBe(true);
  });

  it("hides Google when from is missing", () => {
    const view = joinPageView(null, { signupCount: 0, maxSignups: 10 });

    expect(view.status).toBe("unknown");
    expect(view.showGoogle).toBe(false);
  });

  it("hides Google when the stored link is full", () => {
    const view = joinPageView("T1", { signupCount: 10, maxSignups: 10 });

    expect(view.status).toBe("full");
    expect(view.showGoogle).toBe(false);
  });
});

describe("readJoinFrom", () => {
  it("reads from off the join URL search string", () => {
    expect(readJoinFrom("?from=T1")).toBe("T1");
  });

  it("treats an empty from as missing", () => {
    expect(readJoinFrom("?from=")).toBeNull();
  });

  it("trims from so pasted codes still match", () => {
    expect(readJoinFrom("?from= T1 ")).toBe("T1");
  });
});

describe("startJoinGoogle", () => {
  it("does not start Google when the join link is full", async () => {
    const createOAuthUrl = vi.fn();
    const result = await startJoinGoogle({
      from: "T1",
      origin: "http://localhost:3000",
      lookup: async () => ({ signupCount: 10, maxSignups: 10 }),
      createOAuthUrl,
    });

    expect(result).toEqual({ reason: "full" });
    expect(createOAuthUrl).not.toHaveBeenCalled();
  });

  it("reports an unknown link when the code is not stored", async () => {
    const result = await startJoinGoogle({
      from: "not-a-code",
      origin: "http://localhost:3000",
      lookup: async () => null,
      createOAuthUrl: vi.fn(),
    });

    expect(result).toEqual({ reason: "unknown" });
  });

  it("starts Google with the join from on the auth callback URL", async () => {
    const createOAuthUrl = vi.fn().mockResolvedValue("https://accounts.google.com/oauth");
    const result = await startJoinGoogle({
      from: "T1",
      origin: "http://localhost:3000",
      lookup: async () => ({ signupCount: 0, maxSignups: 10 }),
      createOAuthUrl,
    });

    expect(createOAuthUrl).toHaveBeenCalledWith(
      "http://localhost:3000/auth/callback?from=T1",
    );
    expect(result).toEqual({ url: "https://accounts.google.com/oauth" });
  });
});
