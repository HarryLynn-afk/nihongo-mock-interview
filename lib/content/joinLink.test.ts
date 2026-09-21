import { describe, expect, it, vi } from "vitest";
import { joinClaimResult, joinPageView, readJoinFrom, startJoinGoogle, applyJoinClaim } from "./joinLink";

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

describe("joinClaimResult", () => {
  it("consumes one slot when a new tester consents on an open join link", () => {
    const result = joinClaimResult("T1", { signupCount: 0, maxSignups: 10 }, false);

    expect(result).toEqual({ ok: true, consumeSlot: true });
  });

  it("does not consume a slot when that email is already a Participant", () => {
    const result = joinClaimResult("T1", { signupCount: 10, maxSignups: 10 }, true);

    expect(result).toEqual({ ok: true, consumeSlot: false });
  });

  it("rejects a new tester when the stored link is full", () => {
    const result = joinClaimResult("T1", { signupCount: 10, maxSignups: 10 }, false);

    expect(result).toEqual({ ok: false, status: "full" });
  });

  it("rejects a new tester when from is missing or the code is unknown", () => {
    expect(joinClaimResult(null, { signupCount: 0, maxSignups: 10 }, false)).toEqual({
      ok: false,
      status: "unknown",
    });
    expect(joinClaimResult("T1", null, false)).toEqual({
      ok: false,
      status: "unknown",
    });
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

    expect(result.url).toBeNull();
    expect(createOAuthUrl).not.toHaveBeenCalled();
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
    expect(result.url).toBe("https://accounts.google.com/oauth");
  });
});

describe("applyJoinClaim", () => {
  it("adds the email to the waitlist and consumes a slot for a new open-link tester", async () => {
    const addToWaitlist = vi.fn().mockResolvedValue(undefined);
    const consumeSlot = vi.fn().mockResolvedValue(true);
    const result = await applyJoinClaim({
      from: "T1",
      email: "classmate@school.org",
      alreadyParticipant: false,
      lookup: async () => ({ signupCount: 0, maxSignups: 10 }),
      addToWaitlist,
      consumeSlot,
    });

    expect(result).toEqual({ ok: true, consumeSlot: true });
    expect(consumeSlot).toHaveBeenCalledWith("T1");
    expect(addToWaitlist).toHaveBeenCalledWith("classmate@school.org");
  });

  it("does not add to the waitlist when the last slot is taken during consume", async () => {
    const addToWaitlist = vi.fn();
    const result = await applyJoinClaim({
      from: "T1",
      email: "classmate@school.org",
      alreadyParticipant: false,
      lookup: async () => ({ signupCount: 9, maxSignups: 10 }),
      addToWaitlist,
      consumeSlot: async () => false,
    });

    expect(result).toEqual({ ok: false, status: "full" });
    expect(addToWaitlist).not.toHaveBeenCalled();
  });
});
