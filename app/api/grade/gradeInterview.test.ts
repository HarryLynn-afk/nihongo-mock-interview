import { describe, expect, it, vi } from "vitest";
import { gradeInterview } from "./gradeInterview";
import type { InterviewReport } from "./runGroqGrade";

const groqReport: InterviewReport = {
  total: 88,
  scores: {
    answerRelevance: { raw: 4, weight: 25, points: 25 },
    contentCompleteness: { raw: 4, weight: 25, points: 25 },
    japaneseClarity: { raw: 3, weight: 20, points: 15 },
    grammarPoliteness: { raw: 3, weight: 20, points: 15 },
    consistency: { raw: 3, weight: 10, points: 7.5 },
  },
  critiques: [
    {
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Use です/ます all the way through.",
      rewrite: "はじめまして。",
      category: "grammarPoliteness",
    },
  ],
  profileName: "",
  source: "grade",
  banner: null,
};

describe("gradeInterview", () => {
  it("uses the primary grade and does not call secondary", async () => {
    const primary = vi.fn().mockResolvedValue(groqReport);
    const secondary = vi.fn().mockResolvedValue(null);

    const report = await gradeInterview({ primary, secondary });

    expect(report).toEqual(groqReport);
    expect(primary).toHaveBeenCalledOnce();
    expect(secondary).not.toHaveBeenCalled();
  });

  it("uses the secondary grade when primary misses", async () => {
    const primary = vi.fn().mockResolvedValue(null);
    const secondary = vi.fn().mockResolvedValue(groqReport);

    const report = await gradeInterview({ primary, secondary });

    expect(report).toEqual(groqReport);
    expect(primary).toHaveBeenCalledOnce();
    expect(secondary).toHaveBeenCalledOnce();
  });

  it("returns null when primary and secondary both miss", async () => {
    const primary = vi.fn().mockResolvedValue(null);
    const secondary = vi.fn().mockResolvedValue(null);

    const report = await gradeInterview({ primary, secondary });

    expect(report).toBeNull();
    expect(primary).toHaveBeenCalledOnce();
    expect(secondary).toHaveBeenCalledOnce();
  });
});
