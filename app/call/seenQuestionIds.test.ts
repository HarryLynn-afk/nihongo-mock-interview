import { describe, expect, it } from "vitest";
import { loadSeenQuestionIds, saveSeenQuestionIds } from "./seenQuestionIds";

describe("seenQuestionIds", () => {
  it("round-trips ids in sessionStorage", () => {
    sessionStorage.clear();
    expect(loadSeenQuestionIds()).toEqual([]);
    saveSeenQuestionIds([101, 111, 101]);
    expect(loadSeenQuestionIds()).toEqual([101, 111]);
  });
});
