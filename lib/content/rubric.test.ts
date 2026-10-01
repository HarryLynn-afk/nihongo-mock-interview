import { describe, expect, it } from "vitest";
import { scoreReport } from "./rubric";

describe("scoreReport", () => {
  it("turns five level-4 practice scores into a 100% progress total with no verdict", () => {
    const result = scoreReport({
      answerRelevance: 4,
      contentCompleteness: 4,
      japaneseClarity: 4,
      grammarPoliteness: 4,
      consistency: 4,
    });

    expect(result.total).toBe(100);
    expect(result.scores).toEqual({
      answerRelevance: { raw: 4, weight: 25, points: 25 },
      contentCompleteness: { raw: 4, weight: 25, points: 25 },
      japaneseClarity: { raw: 4, weight: 20, points: 20 },
      grammarPoliteness: { raw: 4, weight: 20, points: 20 },
      consistency: { raw: 4, weight: 10, points: 10 },
    });
    expect(result).not.toHaveProperty("headline");
    expect(result).not.toHaveProperty("stamp");
    expect(result).not.toHaveProperty("gatesFired");
  });

  it("weight-totals a mixed practice session (worked example)", () => {
    const result = scoreReport({
      answerRelevance: 3,
      contentCompleteness: 4,
      japaneseClarity: 2,
      grammarPoliteness: 4,
      consistency: 3,
    });

    expect(result.scores.answerRelevance.points).toBe(18.75);
    expect(result.scores.japaneseClarity.points).toBe(10);
    expect(result.scores.consistency.points).toBe(7.5);
    expect(result.total).toBe(81);
  });

  it("rounds a .5 progress total up", () => {
    const result = scoreReport({
      answerRelevance: 2,
      contentCompleteness: 4,
      japaneseClarity: 4,
      grammarPoliteness: 4,
      consistency: 2,
    });

    expect(result.total).toBe(83);
  });
});
