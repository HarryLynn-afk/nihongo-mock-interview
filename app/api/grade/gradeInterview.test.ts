import { describe, expect, it, vi } from "vitest";
import { gradeInterview } from "./gradeInterview";
import type { InterviewReport } from "./runGroqGrade";

const groqReport: InterviewReport = {
  headline: "Ready",
  stamp: "準備OK",
  total: 92,
  scores: {
    speaking: { raw: 5, weight: 20, points: 20 },
    listening: { raw: 4, weight: 15, points: 12 },
    grammarPoliteness: { raw: 4, weight: 15, points: 12 },
    motivation: { raw: 5, weight: 20, points: 20 },
    studyPlan: { raw: 5, weight: 20, points: 20 },
    consistency: { raw: 4, weight: 10, points: 8 },
  },
  gatesFired: [],
  critiques: [
    {
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Use です/ます all the way through.",
      rewrite: "はじめまして。",
      category: "speaking",
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
