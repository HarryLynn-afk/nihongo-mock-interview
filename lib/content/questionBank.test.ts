import { describe, expect, it } from "vitest";
import { isSubstantialRepeat } from "./followUpCheck";
import {
  CORE_SESSION_LENGTH,
  SESSION_TOPIC_ORDER,
  followUpBank,
  followUpForTopic,
  getBankQuestionById,
  pickSessionQuestions,
  questionBank,
  variantsForTopic,
} from "./questionBank";

const FORBIDDEN_TERMS = [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/];

describe("questionBank", () => {
  it("covers ten core topics with at least three variants each", () => {
    expect(SESSION_TOPIC_ORDER).toHaveLength(10);
    expect(CORE_SESSION_LENGTH).toBe(10);
    for (const topic of SESSION_TOPIC_ORDER) {
      expect(variantsForTopic(topic).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("pickSessionQuestions returns one question per topic in session order", () => {
    const picked = pickSessionQuestions(() => 0);

    expect(picked).toHaveLength(10);
    expect(picked.map((item) => item.topic)).toEqual([...SESSION_TOPIC_ORDER]);
    expect(new Set(picked.map((item) => item.id)).size).toBe(10);
  });

  it("prefers variants that are not in seenQuestionIds, but still covers every topic", () => {
    const first = variantsForTopic("selfIntroduction")[0];
    const picked = pickSessionQuestions(() => 0, [first.id]);

    expect(picked[0].topic).toBe("selfIntroduction");
    expect(picked[0].id).not.toBe(first.id);
    expect(picked).toHaveLength(10);
  });

  it("still picks a topic variant when every variant was seen recently", () => {
    const seen = questionBank.map((item) => item.id);
    const picked = pickSessionQuestions(() => 0, seen);

    expect(picked).toHaveLength(10);
    expect(picked[0].topic).toBe("selfIntroduction");
  });

  it("gives every bank and follow-up Question a Burmese line", () => {
    for (const question of [...questionBank, ...followUpBank]) {
      expect(question.burmeseTranslation.length).toBeGreaterThan(0);
      expect(question.burmeseTranslation).toMatch(/[\u1000-\u109F]/);
    }
  });

  it("never contains forbidden exam terms", () => {
    const allText = [...questionBank, ...followUpBank]
      .map(
        (q) =>
          `${q.japanese} ${q.englishTranslation} ${q.burmeseTranslation}`,
      )
      .join(" ");
    for (const term of FORBIDDEN_TERMS) {
      expect(allText).not.toMatch(term);
    }
  });

  it("keeps after-language-school study as a future-plan question", () => {
    const moved = questionBank.find((item) => item.id === 163);
    expect(moved?.topic).toBe("futurePlan");
    expect(variantsForTopic("studyPlan").some((item) => item.id === 163)).toBe(
      false,
    );
  });

  it("has a topic-specific follow-up for every core topic", () => {
    for (const topic of SESSION_TOPIC_ORDER) {
      const followUp = followUpForTopic(topic);
      expect(followUp.topic).toBe(topic);
      expect(followUp.isFollowUp).toBe(true);
      expect(followUp.japanese).not.toBe("もう少し詳しく教えてください。");
    }
    expect(followUpBank).toHaveLength(SESSION_TOPIC_ORDER.length);
  });

  it("asks how many years the student plans to study at the language school", () => {
    expect(getBankQuestionById(161)?.japanese).toBe(
      "日本語学校で、何年間勉強する予定ですか。",
    );
    expect(getBankQuestionById(161)?.englishTranslation).toBe(
      "How many years do you plan to study at the language school?",
    );
  });

  it("asks the specified motivation and future-plan follow-ups", () => {
    expect(getBankQuestionById(241)?.japanese).toBe(
      "日本語の勉強は、将来の勉強や仕事にどう役立つと思いますか。",
    );
    expect(getBankQuestionById(241)?.englishTranslation).toBe(
      "How do you think studying Japanese will help your future education or work?",
    );
    expect(getBankQuestionById(271)?.japanese).toBe(
      "日本語学校のあと、どのような進路を考えていますか。どうしてですか。",
    );
    expect(getBankQuestionById(271)?.englishTranslation).toBe(
      "What path are you considering after language school, and why?",
    );
  });

  it("offers a self-funding financial-support variant without a sponsor", () => {
    const selfFunded = variantsForTopic("financialSupport").some((item) =>
      /自分/.test(item.japanese),
    );
    expect(selfFunded).toBe(true);
  });

  it("keeps follow-up 211 distinct from question 114", () => {
    const followUp = getBankQuestionById(211);
    const core = getBankQuestionById(114);

    expect(followUp?.isFollowUp).toBe(true);
    expect(core?.japanese).toBeTruthy();
    expect(
      isSubstantialRepeat(core?.japanese ?? "", followUp?.japanese ?? ""),
    ).toBe(false);
  });

  it("keeps every follow-up from substantially repeating a core question in its topic", () => {
    for (const topic of SESSION_TOPIC_ORDER) {
      const followUp = followUpForTopic(topic);
      for (const core of variantsForTopic(topic)) {
        expect(isSubstantialRepeat(core.japanese, followUp.japanese)).toBe(
          false,
        );
      }
    }
  });

  it("resolves generated follow-up ids so TTS can play them", () => {
    const followUp = getBankQuestionById(200);
    expect(followUp?.isFollowUp).toBe(true);
    expect(followUp?.topic).toBe("selfIntroduction");
    expect(followUp?.japanese).toContain("出身地");
  });
});
