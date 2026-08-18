import { describe, expect, it } from "vitest";
import { parseRawScores } from "./rubric";

describe("parseRawScores", () => {
  it("throws when a required category is missing", () => {
    const malformed = {
      speaking: 5,
      listening: 4,
      grammarPoliteness: 4,
      motivation: 5,
      // studyPlan missing
      consistency: 4,
    };

    expect(() => parseRawScores(malformed)).toThrow(/studyPlan/);
  });

  it("throws when a category score is out of the 1-5 range", () => {
    const malformed = {
      speaking: 6,
      listening: 4,
      grammarPoliteness: 4,
      motivation: 5,
      studyPlan: 5,
      consistency: 4,
    };

    expect(() => parseRawScores(malformed)).toThrow(/speaking/);
  });

  it("returns the scores unchanged when the input is already valid", () => {
    const valid = {
      speaking: 5,
      listening: 4,
      grammarPoliteness: 4,
      motivation: 5,
      studyPlan: 5,
      consistency: 4,
    };

    expect(parseRawScores(valid)).toEqual(valid);
  });
});
