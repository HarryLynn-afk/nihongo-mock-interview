import { describe, expect, it } from "vitest";
import {
  formatQuotedCritique,
  futureGoalSpecificity,
  stretchImprovement,
} from "./critiqueCopy";

describe("formatQuotedCritique", () => {
  it("uses the affirming MY frame when rewrite equals quote", () => {
    const view = formatQuotedCritique({
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Clear self-introduction.",
      rewrite: "はじめまして",
      category: "speaking",
    });

    expect(view.quote).toBe("はじめまして");
    expect(view.explanation).toBe("Clear self-introduction.");
    expect(view.rewrite).toBe("はじめまして");
    expect(view.burmese).toBe(
      "သင်ပြောခဲ့သည့်စာကြောင်း − 「はじめまして」။ အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
    );
    expect(view.burmese).not.toContain("ဒီအစား");
  });

  it("uses the corrective MY frame when rewrite differs from quote", () => {
    const view = formatQuotedCritique({
      questionIndex: 0,
      quote: "hello",
      explanation: "Need a Japanese rewrite.",
      rewrite: "はじめまして。",
      category: "speaking",
    });

    expect(view.burmese).toBe(
      "သင်ပြောခဲ့သည့်စာကြောင်း − 「hello」။ အသံထွက်နှင့် စကားစီးဆင်းမှုကို ပိုမိုကောင်းမွန်အောင် ပြုလုပ်ရန်။ ဒီအစား − 「はじめまして。」 ဟုပြောနိုင်ပါသည်။",
    );
    expect(view.burmese).not.toContain("ကောင်းစွာပြောနိုင်ခဲ့ပါသည်");
  });

  it("fills {explanation_my} from the critique category, not speaking by default", () => {
    const view = formatQuotedCritique({
      questionIndex: 1,
      quote: "アニメが好きです",
      explanation: "Answer the school question.",
      rewrite: "この学校で日本語を勉強したいです。",
      category: "listening",
    });

    expect(view.burmese).toContain("မေးခွန်းနှင့် ပိုမိုကိုက်ညီအောင် အဖြေပေးရန်");
    expect(view.burmese).not.toContain("အသံထွက်");
  });

  it("builds optional-enhancement copy for a strong affirming critique", () => {
    expect(stretchImprovement("motivation")).toMatch(/career goal/i);
    expect(futureGoalSpecificity("将来ITエンジニアになりたいです")).toBe("specific");
    expect(futureGoalSpecificity("将来働きたいです")).toBe("vague");
    expect(futureGoalSpecificity("日本語が好きです")).toBe("missing");
  });
});
