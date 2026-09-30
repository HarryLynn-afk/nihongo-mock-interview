import { describe, expect, it } from "vitest";
import { CONSENT_GATE_COOKIE } from "./studyAuth";
import {
  isGuestCall,
  isParticipantCall,
  isRemovedPitchUrl,
  mustSignIn,
  nextAfterAuth,
  routeRole,
} from "./visitPolicy";

describe("isRemovedPitchUrl", () => {
  it("rejects the old presentation URLs and leaves Guest and Participant calls alone", () => {
    expect(isRemovedPitchUrl("/pitch", "")).toBe(true);
    expect(isRemovedPitchUrl("/call", "?pitch=1")).toBe(true);
    expect(isRemovedPitchUrl("/call", "?guest=1&pitch=1")).toBe(true);
    expect(isRemovedPitchUrl("/call", "?guest=1")).toBe(false);
    expect(isRemovedPitchUrl("/call", "")).toBe(false);
    expect(isRemovedPitchUrl("/", "?pitch=1")).toBe(false);
  });
});

describe("routeRole", () => {
  it("maps learner entry points", () => {
    expect(routeRole("/")).toBe("guestHome");
    expect(routeRole("/login")).toBe("participantEntry");
    expect(routeRole("/join")).toBe("participantEntry");
    expect(routeRole("/consent")).toBe("consent");
    expect(routeRole("/call")).toBe("call");
    expect(routeRole("/pitch")).toBe("other");
    expect(routeRole("/auth/callback")).toBe("auth");
  });
});

describe("isParticipantCall", () => {
  it("is true only for practice /call without the guest flag", () => {
    expect(isParticipantCall("/call", "")).toBe(true);
    expect(isParticipantCall("/call", "?")).toBe(true);
    expect(isParticipantCall("/call", "?guest=1")).toBe(false);
    expect(isParticipantCall("/call", "?pitch=1")).toBe(false);
    expect(isParticipantCall("/consent", "")).toBe(false);
  });
});

describe("isGuestCall", () => {
  it("reads the guest flag", () => {
    expect(isGuestCall("?guest=1")).toBe(true);
    expect(isGuestCall("guest=1")).toBe(true);
    expect(isGuestCall("")).toBe(false);
  });
});

describe("mustSignIn", () => {
  it("blocks leftover /consent without a visit cookie", () => {
    expect(mustSignIn("/consent", "", undefined)).toBe(true);
    expect(mustSignIn("/consent", "", "ok")).toBe(false);
  });

  it("blocks Participant /call without a visit cookie", () => {
    expect(mustSignIn("/call", "", undefined)).toBe(true);
    expect(mustSignIn("/call", "", "ok")).toBe(false);
  });

  it("lets a Guest call through without a visit cookie", () => {
    expect(mustSignIn("/call", "?guest=1", undefined)).toBe(false);
  });

  it("does not gate home, login, or join-link", () => {
    expect(mustSignIn("/", "", "ok")).toBe(false);
    expect(mustSignIn("/login", "", undefined)).toBe(false);
    expect(mustSignIn("/join", "?from=rsu-k7m2", undefined)).toBe(false);
  });
});

describe("nextAfterAuth", () => {
  it("returns successful sign-in to its originating landing", () => {
    expect(nextAfterAuth({ from: null, ok: true })).toBe("/");
    expect(nextAfterAuth({ from: "rsu-k7m2", ok: true })).toBe("/join?from=rsu-k7m2");
  });

  it("returns join or login when auth misses", () => {
    expect(nextAfterAuth({ from: "rsu-k7m2", ok: false })).toBe(
      "/join?from=rsu-k7m2",
    );
    expect(nextAfterAuth({ from: null, ok: false })).toBe("/login");
  });
});

describe("visit cookie name", () => {
  it("keeps the existing consent-gate cookie name", () => {
    expect(CONSENT_GATE_COOKIE).toBe("nihongo_consent_gate");
  });
});
