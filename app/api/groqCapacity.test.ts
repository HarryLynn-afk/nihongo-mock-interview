import { afterEach, describe, expect, it } from "vitest";
import {
  isGroqCapacityLimit,
  noteGroqCapacityLimit,
  resetGroqCapacityForTests,
  shouldSkipGroqCall,
} from "./groqCapacity";

describe("groqCapacity", () => {
  afterEach(() => {
    resetGroqCapacityForTests();
  });

  it("treats 429, 503, and 529 as capacity limits, not 400 or 500", () => {
    expect(isGroqCapacityLimit(429)).toBe(true);
    expect(isGroqCapacityLimit(503)).toBe(true);
    expect(isGroqCapacityLimit(529)).toBe(true);
    expect(isGroqCapacityLimit(400)).toBe(false);
    expect(isGroqCapacityLimit(500)).toBe(false);
  });

  it("skips later Groq calls for that purpose until the cooldown ends", () => {
    expect(shouldSkipGroqCall("grade", 1_000)).toBe(false);

    noteGroqCapacityLimit("grade", 1_000, 60_000);

    expect(shouldSkipGroqCall("grade", 1_000)).toBe(true);
    expect(shouldSkipGroqCall("grade", 60_999)).toBe(true);
    expect(shouldSkipGroqCall("grade", 61_000)).toBe(false);
    expect(shouldSkipGroqCall("translate", 1_000)).toBe(false);
  });
});
