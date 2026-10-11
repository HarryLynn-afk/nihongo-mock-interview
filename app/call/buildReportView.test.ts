import { describe, expect, it } from "vitest";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { questions } from "@/lib/content/questions";
import { getBankQuestionById } from "@/lib/content/questionBank";
import { buildReportView } from "./buildReportView";

const report: InterviewReport = {
  total: 81,
  scores: {
    answerRelevance: { raw: 3, weight: 25, points: 18.75 },
    contentCompleteness: { raw: 4, weight: 25, points: 25 },
    japaneseClarity: { raw: 2, weight: 20, points: 10 },
    grammarPoliteness: { raw: 4, weight: 20, points: 20 },
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
  it("limits goal-specific advice to future-plan questions in both languages", () => {
    const generic = {
      en: "add one or two concrete details (a reason, a place, or a next step) so the answer feels complete.",
      my: "အကြောင်းရင်း၊ နေရာ သို့မဟုတ် နောက်တစ်ဆင့်ကဲ့သို့ အတိအကျ အချက်အလက် တစ်ခုနှစ်ခု ထည့်ပြောပါ။",
    };
    const cases = [
      { id: 183, transcript: "父はITエンジニアです。", expected: generic },
      { id: 9999, transcript: "将来ITエンジニアになりたいです。", expected: generic },
      {
        id: 172, transcript: "将来ITエンジニアになりたいです。",
        expected: {
          en: "connect this goal more directly to your choice of Japanese language school.",
          my: "ဤရည်မှန်းချက်ကို ဂျပန်ဘာသာစကားကျောင်း ရွေးချယ်မှုနှင့် ပိုမိုတိုက်ရိုက် ချိတ်ဆက်ပါ။",
        },
      },
      {
        id: 172, transcript: "将来働きたいです。",
        expected: {
          en: "make your future goal more specific.",
          my: "သင့်အနာဂတ် ရည်မှန်းချက်ကို ပိုမိုတိကျအောင် ဖော်ပြပါ။",
        },
      },
    ];
    for (const { id, transcript, expected } of cases) {
      for (const locale of ["en", "my"] as const) {
        const view = buildReportView({
          report: {
            ...report,
            critiques: [{
              questionIndex: 0, quote: transcript, rewrite: transcript,
              explanation: "Complete answer.", category: "contentCompleteness",
            }],
          },
          answers: [{ questionIndex: 0, status: "answered", transcript }],
          sessionQuestions: [getBankQuestionById(id) ?? { ...questions[0], id }],
          locale,
        });
        expect(view.questions[0].affirming).toBe(true);
        expect(view.questions[0].improvement).toContain(expected[locale]);
        expect(view.questions[0].rewrite).toBe(transcript);
      }
    }
  });

  it("exposes the practice progress total and five criterion rows without a verdict", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
    });

    expect(view.title).toBe("AI Interview Practice Feedback");
    expect(view.answerQualityTitle).toBe("Interview Answer Quality");
    expect(view.progressLabel).toBe("Practice progress");
    expect(view.total).toBe(81);
    expect(view.banner).toBeNull();
    expect(view.disclaimer).toMatch(/not an official admission assessment/i);
    expect(view.scores.map((score) => score.key)).toEqual([
      "answerRelevance",
      "contentCompleteness",
      "japaneseClarity",
      "grammarPoliteness",
      "consistency",
    ]);
    expect(view.scores.find((score) => score.key === "answerRelevance")).toEqual({
      key: "answerRelevance",
      label: "Answer relevance",
      radarLabel: "Relevance",
      level: 3,
      levelLabel: "Adequate for practice",
    });
    expect(view).not.toHaveProperty("headlineLabel");
    expect(view).not.toHaveProperty("stamp");
    expect(view).not.toHaveProperty("listeningNote");
    expect(view).not.toHaveProperty("voiceNote");
  });

  it("gives each answered Question one evidence quote, one improvement, and one rewrite", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
    });
    const card = view.questions[0];

    expect(view.questions).toHaveLength(3);
    expect(card.japanese).toBe(questions[0].japanese);
    expect(card.transcript).toBe("はじめまして");
    expect(card.quote).toBe("はじめまして");
    expect(card.evidence).toBe("Use です/ます all the way through.");
    expect(card.improvement).toBe("Use です/ます all the way through.");
    expect(card.improvementHeading).toBe("Improve next");
    expect(card.rewrite).toBe("はじめまして。");
    expect(card.categoryLabel).toBe("Grammar and politeness");
    expect(card.ratingLabel).toBe("Strong practice response");
    expect(card.affirming).toBe(false);
    expect(card).not.toHaveProperty("strengths");
    expect(card).not.toHaveProperty("improvements");
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
    expect(view.questions[1].improvement).toMatch(/microphone/i);
    expect(view.questions[1].rewrite).toBe("");
    expect(view.questions[1].affirming).toBe(false);
    expect(view.questions[0].transcript).toBe("はじめまして");
    expect(view.questions[2].transcript).toBe("専門学校に行きます");
  });

  it("turns an affirming critique into one optional stretch with a useful phrase", () => {
    const three = {
      ...report,
      critiques: [
        report.critiques[0],
        {
          questionIndex: 1,
          quote: "この学校",
          explanation: "Name the school.",
          rewrite: "この学校",
          category: "contentCompleteness" as const,
        },
        {
          questionIndex: 2,
          quote: "専門学校",
          explanation: "Name a next step.",
          rewrite: "専門学校でウェブを勉強します。",
          category: "contentCompleteness" as const,
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

    expect(view.questions[1].affirming).toBe(true);
    expect(view.questions[1].improvementHeading).toBe("Optional enhancement");
    expect(view.questions[1].rewriteHeading).toBe("Useful phrase to keep");
    expect(view.questions[1].improvement).toMatch(/richer answer/i);
    expect(view.questions[1].rewrite).toBe("この学校");
  });

  it("localizes every question card string when MM is selected", () => {
    const view = buildReportView({
      report,
      answers: voiceAnswers,
      locale: "my",
    });
    const card = view.questions[0];

    expect(card).not.toHaveProperty("burmese");
    expect(card.evidence).toBe(
      "ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှုကို ပိုမိုတိကျအောင် ပြုလုပ်ရန်။",
    );
    expect(card.improvement).toBe(
      "ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှုကို ပိုမိုတိကျအောင် ပြုလုပ်ရန်။",
    );
    expect(card.improvementHeading).toBe("နောက်တစ်ကြိမ် တိုးတက်အောင်");
    expect(card.rewriteHeading).toBe("အကြံပြု ဂျပန်အဖြေ");
    expect(card.categoryLabel).toBe("သဒ္ဒါနှင့် ယဉ်ကျေးမှု");
    expect(card.ratingLabel).toBe("ကောင်းမွန်သော လေ့ကျင့်မှုအဖြေ");
  });
});
