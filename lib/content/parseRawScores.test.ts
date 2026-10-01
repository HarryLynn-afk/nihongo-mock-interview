import { describe, expect, it } from "vitest";
import { parseRawScores } from "./rubric";

const VALID = {
  answerRelevance: 3,
  contentCompleteness: 4,
  japaneseClarity: 2,
  grammarPoliteness: 4,
  consistency: 3,
} as const;

describe("parseRawScores", () => {
  it("throws when a required category is missing", () => {
    const { contentCompleteness, ...malformed } = VALID;

    expect(contentCompleteness).toBe(4);
    expect(() => parseRawScores(malformed)).toThrow(/contentCompleteness/);
  });

  it("throws when a category score is above the 1-4 range", () => {
    expect(() => parseRawScores({ ...VALID, answerRelevance: 5 })).toThrow(
      /answerRelevance/,
    );
  });

  it("throws when a category score is below the 1-4 range", () => {
    expect(() => parseRawScores({ ...VALID, consistency: 0 })).toThrow(
      /consistency/,
    );
  });

  it("throws when a category score is not an integer", () => {
    expect(() => parseRawScores({ ...VALID, japaneseClarity: 2.5 })).toThrow(
      /japaneseClarity/,
    );
  });

  it("returns the scores unchanged when the input is already valid", () => {
    expect(parseRawScores(VALID)).toEqual(VALID);
  });
});
