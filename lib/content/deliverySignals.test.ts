import { describe, expect, it } from "vitest";
import {
  analyzeWordTimings,
  longestMidAnswerGap,
  midAnswerGaps,
  summarizeDelivery,
  unableClip,
} from "./deliverySignals";
import type { WordTiming } from "./deliveryCoaching";

function words(...pairs: Array<[number, number]>): WordTiming[] {
  return pairs.map(([start, end], index) => ({
    word: `w${index}`,
    start,
    end,
  }));
}

describe("midAnswerGaps", () => {
  it("ignores leading and trailing silence and only counts gaps between words", () => {
    // Leading silence before 1.0 and trailing after 6.0 do not count.
    const gaps = midAnswerGaps(words([1, 1.2], [1.4, 1.6], [4.0, 4.2]));
    expect(gaps).toEqual([2.4]);
  });

  it("ignores gaps under the 2.0s coaching threshold", () => {
    expect(midAnswerGaps(words([0, 0.2], [1.5, 1.7]))).toEqual([]);
  });
});

describe("analyzeWordTimings", () => {
  it("returns unable when fewer than two words are present", () => {
    expect(analyzeWordTimings({ words: [], questionIndex: 0 }).unableReason).toBe(
      "noTimestamps",
    );
    expect(
      analyzeWordTimings({
        words: [{ word: "はい", start: 0, end: 0.2 }],
        questionIndex: 0,
      }).unableReason,
    ).toBe("noTimestamps");
  });

  it("builds a template tip from the longest mid-answer gap", () => {
    const result = analyzeWordTimings({
      words: words([0, 0.3], [3.1, 3.4], [3.5, 3.7]),
      questionIndex: 1,
      questionId: 2,
    });

    expect(result.recordingQuality).toBe("pass");
    expect(result.tip).toMatchObject({
      questionLabel: "Q2 · Motivation",
      evidence: "A 2.8-second pause occurred mid-answer.",
      gapSec: 2.8,
    });
    expect(result.tip?.tryNext).toMatch(/motivation/i);
  });

  it("returns pass with no tip when speech has no long mid-answer gap", () => {
    const result = analyzeWordTimings({
      words: words([0, 0.2], [0.4, 0.6], [0.8, 1.0]),
      questionIndex: 0,
      questionId: 1,
    });

    expect(result.recordingQuality).toBe("pass");
    expect(result.tip).toBeNull();
  });
});

describe("summarizeDelivery", () => {
  it("returns unavailable when there are no spoken answers", () => {
    const session = summarizeDelivery([]);
    expect(session.status).toBe("unavailable");
    expect(session.tips).toEqual([]);
  });

  it("returns unable to assess when every answer lacks timestamps", () => {
    const session = summarizeDelivery([
      { questionIndex: 0, signal: unableClip("empty") },
      { questionIndex: 1, signal: unableClip("noTimestamps") },
    ]);
    expect(session.status).toBe("unableToAssess");
    expect(session.tipCount).toBe(0);
  });

  it("returns noIssue when timestamps exist and no tip qualifies", () => {
    const session = summarizeDelivery([
      {
        questionIndex: 0,
        questionId: 1,
        words: words([0, 0.2], [0.5, 0.7]),
      },
    ]);
    expect(session.status).toBe("noIssue");
    expect(session.headline).toBe("No notable issue detected");
  });

  it("returns review with tips and never grades from pause count alone", () => {
    const session = summarizeDelivery([
      {
        questionIndex: 1,
        questionId: 2,
        words: words([0, 0.2], [2.5, 2.7]),
      },
    ]);
    expect(session.status).toBe("review");
    expect(session.tipCount).toBe(1);
    expect(session.tips[0]?.evidence).toMatch(/2\.3-second pause/i);
    expect(session.tips[0]?.tryNext).toMatch(/motivation/i);
  });

  it("picks the longest gap when several mid-answer gaps exist", () => {
    expect(
      longestMidAnswerGap(words([0, 0.1], [2.2, 2.3], [5.5, 5.6])),
    ).toBeCloseTo(3.2, 5);
  });
});
