import { describe, expect, it } from "vitest";
import type { InterviewReport } from "@/lib/content/sampleReport";
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
  coaching: ["Use です/ます all the way through."],
  profileName: "Aung Min Khant",
  source: "n8n",
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

    expect(view.coaching).toContain(TYPED_LINE);
    expect(view.coaching[0]).toBe("Use です/ます all the way through.");
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

    expect(view.coaching.some((line) => /life plan/i.test(line))).toBe(true);
    expect(view.coaching.some((line) => /Japanese/i.test(line))).toBe(true);
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

    expect(view.coaching.some((line) => /life plan/i.test(line))).toBe(false);
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
});
