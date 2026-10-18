import { afterEach, describe, expect, it } from "vitest";
import {
  FULL_SESSION_REQUEST_KEY,
  markFullSessionRequestSent,
  normalizeRequestEmail,
  readFullSessionRequestSent,
} from "./fullSessionRequest";

describe("full session request", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("normalizes a usable email and rejects a blank one", () => {
    expect(normalizeRequestEmail("  Ada@Example.com ")).toBe("ada@example.com");
    expect(normalizeRequestEmail("not-an-email")).toBeNull();
    expect(normalizeRequestEmail("")).toBeNull();
  });

  it("rejects oversized addresses before they reach the database", () => {
    expect(normalizeRequestEmail("a".repeat(255) + "@example.com")).toBeNull();
  });

  it("remembers a send for this visit only as a flag", () => {
    expect(readFullSessionRequestSent()).toBe(false);
    markFullSessionRequestSent();
    expect(sessionStorage.getItem(FULL_SESSION_REQUEST_KEY)).toBe("sent");
    expect(readFullSessionRequestSent()).toBe(true);
  });
});
