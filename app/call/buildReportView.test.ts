import { describe, expect, it } from "vitest";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { formatQuotedCritique } from "@/lib/content/critiqueCopy";
import { questions } from "@/lib/content/questions";
import { buildReportView } from "./buildReportView";

const report: InterviewReport = {
  headline: "Ready",
  stamp: "準備OK",
  total: 90,
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

const voiceAnswers = [
  { questionIndex: 0, status: "answered" as const, transcript: "はじめまして" },
  { questionIndex: 1, status: "answered" as const, transcript: "日本で勉強したいです" },
  { questionIndex: 2, status: "answered" as const, transcript: "専門学校に行きます" },
];

describe("buildReportView", () => {
  it("does not treat a speaking Gate as Japanese-ability coaching", () => {
    const view = buildReportView({
      report: { ...report, headline: "KeepPracticing", stamp: "要練習", gatesFired: ["speaking"] },
      answers: voiceAnswers,
    });

    expect(view.notes.some((line) => /life plan/i.test(line))).toBe(false);
  });

  it("exposes AI Interview Practice Feedback, stamp color, content scores, and the transcript /100 total", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
    });

    expect(view.title).toBe("AI Interview Practice Feedback");
    expect(view.answerQualityTitle).toBe("Interview Answer Quality");
    expect(view).not.toHaveProperty("answerQualityNote");
    expect(view.headlineLabel).toBe("Strong");
    expect(view.stamp).toBe("準備OK");
    expect(view.stampColorClass).toBe("text-feather");
    expect(view.total).toBe(90);
    expect(view.banner).toBeNull();
    expect(view.disclaimer).toMatch(/not an official language-proficiency/i);
    expect(view.scores.map((score) => score.key)).toEqual([
      "listening",
      "grammarPoliteness",
      "motivation",
      "studyPlan",
      "consistency",
    ]);
    expect(view).not.toHaveProperty("delivery");
    expect(view.voiceNote).toBeNull();
  });

  it("shows Answer relevance instead of a listening-comprehension score", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
    });

    expect(view.scores.find((score) => score.key === "listening")?.label).toBe(
      "Answer relevance",
    );
    expect(view.listeningNote).toMatch(/listening comprehension is not scored/i);
  });

  it("builds one question card per Interview Question", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
    });

    expect(view.questions).toHaveLength(3);
    expect(view.questions[0].japanese).toBe(questions[0].japanese);
    expect(view.questions[0].transcript).toBe("はじめまして");
    expect(view.questions[0].improvements).toEqual([
      "Use です/ます all the way through.",
    ]);
    expect(view.questions[0].rewrite).toBe("はじめまして。");
    expect(view.questions[0].scoreText).toBe("—");
    expect(view.questions[0].affirming).toBe(false);
  });

  it("builds a no-answer card for a skipped Question, keeping the nav complete", () => {
    const view = buildReportView({
      report,
      answers: [
        { questionIndex: 0, status: "answered", transcript: "はじめまして" },
        { questionIndex: 1, status: "skipped" },
        { questionIndex: 2, status: "answered", transcript: "専門学校に行きます" },
      ],
    });

    expect(view.questions).toHaveLength(3);
    expect(view.questions[1].transcript).toBe(
      "No answer was captured for this Question.",
    );
    expect(view.questions[1].scoreText).toBe("—");
    expect(view.questions[1].strengths).toEqual([]);
    expect(view.questions[1].improvements[0]).toMatch(/microphone/i);
    expect(view.questions[1].rewrite).toBe("");
    expect(view.questions[1].affirming).toBe(false);
    expect(view.questions[0].transcript).toBe("はじめまして");
    expect(view.questions[2].transcript).toBe("専門学校に行きます");
  });

  it("exposes formatted critiques instead of freeform coaching notes", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
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
        { questionIndex: 0, status: "answered" as const, transcript: "この学校" },
        { questionIndex: 1, status: "answered" as const, transcript: "この学校" },
        { questionIndex: 2, status: "answered" as const, transcript: "専門学校" },
      ],
    });

    expect(view.critiques).toHaveLength(3);
    expect(view.critiques[1].burmese).toContain("၊");
    expect(view.critiques[2].burmese).toContain("ဒီအစား");
    expect(view.questions[1].affirming).toBe(true);
    expect(view.questions[1].strengths).toEqual(["Name the school."]);
    expect(view.questions[1].nextHeading).toBe("Optional enhancement");
    expect(view.questions[1].rewriteHeading).toBe("Useful phrase to keep");
    expect(view.questions[1].rewrite).toBe("この学校");
  });
});
