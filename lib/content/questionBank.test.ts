import { describe, expect, it } from "vitest";
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

  it("never contains forbidden exam terms", () => {
    const allText = [...questionBank, ...followUpBank]
      .map((q) => `${q.japanese} ${q.englishTranslation} ${q.burmeseTranslation}`)
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

  it("resolves generated follow-up ids so TTS can play them", () => {
    const followUp = getBankQuestionById(200);
    expect(followUp?.isFollowUp).toBe(true);
    expect(followUp?.topic).toBe("selfIntroduction");
    expect(followUp?.japanese).toContain("出身地");
  });
});
