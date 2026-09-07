import { describe, expect, it } from "vitest";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { formatQuotedCritique } from "@/lib/content/critiqueCopy";
import { buildReportView } from "./buildReportView";

const TYPED_LINE =
  "This answer was typed, so pronunciation was not checked.";

const report: InterviewReport = {
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
  profileName: "Aung Min Khant",
  source: "grade",
  banner: null,
};

describe("buildReportView", () => {
  it("adds the typed-answer coaching line when an answer was typed", () => {
    const view = buildReportView({
      report,
      answers: [
        { questionIndex: 0, inputMode: "typed" },
        { questionIndex: 1, inputMode: "voice" },
        { questionIndex: 2, inputMode: "voice" },
      ],
    });

    expect(view.notes).toContain(TYPED_LINE);
    expect(view.notes[0]).toBe(TYPED_LINE);
  });

  it("adds Speaking-gap coaching when Speaking gated but motivation and study plan did not", () => {
    const view = buildReportView({
      report: { ...report, headline: "KeepPracticing", stamp: "要練習", gatesFired: ["speaking"] },
      answers: [
        { questionIndex: 0, inputMode: "voice" },
        { questionIndex: 1, inputMode: "voice" },
        { questionIndex: 2, inputMode: "voice" },
      ],
    });

    expect(view.notes.some((line) => /life plan/i.test(line))).toBe(true);
    expect(view.notes.some((line) => /Japanese/i.test(line))).toBe(true);
  });

  it("does not add Speaking-gap coaching when a motivation or study-plan gate also fired", () => {
    const view = buildReportView({
      report: {
        ...report,
        headline: "KeepPracticing",
        stamp: "要練習",
        gatesFired: ["speaking", "motivation"],
      },
      answers: [
        { questionIndex: 0, inputMode: "voice" },
        { questionIndex: 1, inputMode: "voice" },
        { questionIndex: 2, inputMode: "voice" },
      ],
    });

    expect(view.notes.some((line) => /life plan/i.test(line))).toBe(false);
  });

  it("exposes Interview Readiness, the stamp in its locked color, six scores, and the /100 total", () => {
    const view = buildReportView({
      report,
      answers: [
        { questionIndex: 0, inputMode: "voice" },
        { questionIndex: 1, inputMode: "voice" },
        { questionIndex: 2, inputMode: "voice" },
      ],
    });

    expect(view.title).toBe("Interview Readiness");
    expect(view.stamp).toBe("準備OK");
    expect(view.stampColorClass).toBe("text-stamp-ready");
    expect(view.total).toBe(92);
    expect(view.banner).toBeNull();
    expect(view.scores.map((score) => score.key)).toEqual([
      "speaking",
      "listening",
      "grammarPoliteness",
      "motivation",
      "studyPlan",
      "consistency",
    ]);
    expect(view.scores[0]).toEqual({
      key: "speaking",
      label: "Speaking",
      raw: 5,
      points: 20,
    });
  });

  it("exposes formatted critiques instead of freeform coaching notes", () => {
    const view = buildReportView({
      report,
      answers: [
        { questionIndex: 0, inputMode: "voice" },
        { questionIndex: 1, inputMode: "voice" },
        { questionIndex: 2, inputMode: "voice" },
      ],
    });

    expect(view.critiques).toEqual([
      formatQuotedCritique(report.critiques[0]),
    ]);
    expect(view).not.toHaveProperty("coaching");
  });

  it("formats every stored critique, not a 2-4 coaching list", () => {
    const three = {
      ...report,
      critiques: [
        report.critiques[0],
        {
          questionIndex: 1,
          quote: "この学校",
          explanation: "Name the school.",
          rewrite: "この学校",
          category: "motivation" as const,
        },
        {
          questionIndex: 2,
          quote: "専門学校",
          explanation: "Name a next step.",
          rewrite: "専門学校でウェブを勉強します。",
          category: "studyPlan" as const,
        },
      ],
    };
    const view = buildReportView({
      report: three,
      answers: [
        { questionIndex: 0, inputMode: "voice" },
        { questionIndex: 1, inputMode: "voice" },
        { questionIndex: 2, inputMode: "voice" },
      ],
    });

    expect(view.critiques).toHaveLength(3);
    expect(view.critiques[1].burmese).toContain("၊");
    expect(view.critiques[2].burmese).toContain("ဒီအစား");
  });
});
