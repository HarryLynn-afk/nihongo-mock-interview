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
        category: "speaking",
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
        category: "speaking",
      },
      "my",
    );

    expect(view.explanation).toBe(
      "အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
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
        category: "listening",
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
  it("localizes the affirming enhancement lines when MM is selected", () => {
    const view = buildNextStep({
      affirming: true,
      raw: 5,
      category: "motivation",
      transcript: "日本で勉強したいです",
      quote: "日本で勉強したいです",
      explanation: "Add a personal future goal.",
      rewrite: "日本で勉強したいです",
      locale: "my",
    });

    expect(view.heading).toBe("ထပ်မံ တိုးတက်အောင်");
    expect(view.lines).toEqual([
      "ဤအချက်ကို သင့်အဖြေက ကောင်းမွန်စွာ ပြည့်မီပြီးဖြစ်သည်။",
      "ပိုမိုကြွယ်ဝသော အဖြေလိုချင်လျှင် သင့်ရည်ရွယ်ချက်ကို ပိုမိုကိုယ်ပိုင်ဆန်အောင် အနာဂတ် လေ့လာရေး သို့မဟုတ် အလုပ်အကိုင် ရည်မှန်းချက်တစ်ခု ထည့်ပါ။",
    ]);
    expect(view.rewriteHeading).toBe("သိမ်းထားသင့်သော စကားစု");
  });
});
