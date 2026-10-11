import { describe, expect, it } from "vitest";
import {
  buildNextStep,
  formatQuotedCritique,
  futureGoalSpecificity,
} from "./critiqueCopy";

describe("formatQuotedCritique", () => {
  it("returns the AI explanation when ENG is selected", () => {
    const view = formatQuotedCritique(
      {
        questionIndex: 0,
        quote: "はじめまして",
        explanation: "Clear self-introduction.",
        rewrite: "はじめまして",
        category: "japaneseClarity",
      },
      "en",
    );

    expect(view.explanation).toBe("Clear self-introduction.");
    expect(view).not.toHaveProperty("burmese");
  });

  it("returns a standalone Burmese affirmation when MM is selected", () => {
    const view = formatQuotedCritique(
      {
        questionIndex: 0,
        quote: "はじめまして",
        explanation: "Clear self-introduction.",
        rewrite: "はじめまして",
        category: "japaneseClarity",
      },
      "my",
    );

    expect(view.explanation).toBe(
      "ဂျပန်စကားကို ရှင်းလင်းစွာ ပြောနိုင်ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
    );
    expect(view.explanation).not.toContain("ဒီအစား");
  });

  it("returns the category's corrective Burmese advice when the rewrite differs", () => {
    const view = formatQuotedCritique(
      {
        questionIndex: 1,
        quote: "アニメが好きです",
        explanation: "Answer the school question.",
        rewrite: "この学校で日本語を勉強したいです。",
        category: "answerRelevance",
      },
      "my",
    );

    expect(view.explanation).toBe(
      "မေးခွန်းနှင့် ပိုမိုကိုက်ညီအောင် အဖြေပေးရန်။",
    );
    expect(view.explanation).not.toContain("အသံထွက်");
  });

  it("classifies future-goal specificity from the transcript", () => {
    expect(futureGoalSpecificity("将来ITエンジニアになりたいです")).toBe("specific");
    expect(futureGoalSpecificity("将来働きたいです")).toBe("vague");
    expect(futureGoalSpecificity("日本語が好きです")).toBe("missing");
  });
});

describe("buildNextStep", () => {
  it("returns the explanation as the single improvement when a correction is needed", () => {
    const view = buildNextStep({
      affirming: false,
      raw: 1,
      category: "grammarPoliteness",
      transcript: "はじめまして",
      topic: "selfIntroduction",
      quote: "はじめまして",
      explanation: "Use です/ます all the way through.",
      rewrite: "はじめまして。",
      locale: "en",
    });

    expect(view.improvement).toBe("Use です/ます all the way through.");
    expect(view.heading).toBe("Improve next");
    expect(view.rewriteHeading).toBe("Suggested improved Japanese answer");
    expect(view.rewrite).toBe("はじめまして。");
  });

  it("turns the improvement into one optional stretch for a strong answer", () => {
    const view = buildNextStep({
      affirming: true,
      raw: 4,
      category: "contentCompleteness",
      transcript: "日本で勉強したいです",
      topic: "motivationJapan",
      quote: "日本で勉強したいです",
      explanation: "Add a personal future goal.",
      rewrite: "日本で勉強したいです",
      locale: "my",
    });

    expect(view.heading).toBe("ထပ်မံ တိုးတက်အောင်");
    expect(view.improvement).toBe(
      "ပိုမိုကြွယ်ဝသော အဖြေလိုချင်လျှင် အကြောင်းရင်း၊ နေရာ သို့မဟုတ် နောက်တစ်ဆင့်ကဲ့သို့ အတိအကျ အချက်အလက် တစ်ခုနှစ်ခု ထည့်ပြောပါ။",
    );
    expect(view.rewriteHeading).toBe("သိမ်းထားသင့်သော စကားစု");
  });

  it("invites an optional stretch for an affirming level-3 answer", () => {
    const view = buildNextStep({
      affirming: true,
      raw: 3,
      category: "answerRelevance",
      transcript: "学校のことを聞かれました",
      topic: "schoolChoice",
      quote: "学校",
      explanation: "Cover every part of the question.",
      rewrite: "学校",
      locale: "en",
    });

    expect(view.heading).toBe("Make it even stronger");
    expect(view.improvement).toBe(
      "Optional: cover every part Tanaka-sensei asked, not only the first clause.",
    );
    expect(view.rewrite).toBe("学校");
  });
});
