import { describe, expect, it } from "vitest";
import {
  accessKeysMatch,
  isPitchCallPath,
  pitchCallRedirectPath,
  pitchGateIsOpen,
  signPitchGateToken,
} from "./pitchGate";

describe("pitchGate", () => {
  it("treats only /call?pitch=1 as a Pitch call", () => {
    expect(isPitchCallPath("/call", "?pitch=1")).toBe(true);
    expect(isPitchCallPath("/call", "pitch=1")).toBe(true);
    expect(isPitchCallPath("/call", "")).toBe(false);
    expect(isPitchCallPath("/call", "?pitch=0")).toBe(false);
    expect(isPitchCallPath("/pitch", "?pitch=1")).toBe(false);
    expect(isPitchCallPath("/", "?pitch=1")).toBe(false);
  });

  it("rejects an empty cookie or a missing secret", async () => {
    expect(await pitchGateIsOpen(undefined, "secret")).toBe(false);
    expect(await pitchGateIsOpen("token", null)).toBe(false);
    expect(await pitchGateIsOpen("token", "")).toBe(false);
  });

  it("accepts only the HMAC cookie for that secret", async () => {
    const token = await signPitchGateToken("secret");
    expect(await pitchGateIsOpen(token, "secret")).toBe(true);
    expect(await pitchGateIsOpen(token, "other")).toBe(false);
    expect(await pitchGateIsOpen("not-a-token", "secret")).toBe(false);
  });

  it("matches access keys without leaking length via a thrown compare", async () => {
    expect(await accessKeysMatch("secret", "secret")).toBe(true);
    expect(await accessKeysMatch("nope", "secret")).toBe(false);
    expect(await accessKeysMatch("short", "much-longer-secret")).toBe(false);
  });

  it("redirects a locked Pitch call to /pitch and leaves an open one alone", async () => {
    const token = await signPitchGateToken("secret");

    expect(
      await pitchCallRedirectPath("/call", "?pitch=1", undefined, "secret"),
    ).toBe("/pitch");
    expect(
      await pitchCallRedirectPath("/call", "?pitch=1", token, "secret"),
    ).toBeNull();
    expect(
      await pitchCallRedirectPath("/call", "", undefined, "secret"),
    ).toBeNull();
    expect(
      await pitchCallRedirectPath("/pitch", "", undefined, "secret"),
    ).toBeNull();
  });
});
