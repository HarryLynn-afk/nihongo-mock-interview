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
  it("uses the Groq grade once", async () => {
    const fallback = vi.fn().mockResolvedValue(groqReport);

    const report = await gradeInterview({ fallback });

    expect(report).toEqual(groqReport);
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("uses the sample report with the scoring-unavailable banner when Groq misses", async () => {
    const fallback = vi.fn().mockResolvedValue(null);

    const report = await gradeInterview({ fallback });

    expect(report?.source).toBe("sample");
    expect(report?.banner).toBe("Scoring unavailable — sample report.");
    expect(report?.headline).toBe("Ready");
    expect(fallback).toHaveBeenCalledOnce();
  });
});
