import { describe, expect, it } from "vitest";
import { questions } from "./questions";

const FORBIDDEN_TERMS = [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/];

describe("questions", () => {
  it("has exactly 3 entries in the locked order with the exact PRD Japanese lines", () => {
    expect(questions).toHaveLength(3);
    expect(questions[0].japanese).toBe("はじめに、簡単に自己紹介をお願いします。");
    expect(questions[1].japanese).toBe(
      "どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。",
    );
    expect(questions[2].japanese).toBe("日本語学校を卒業した後は、何をする予定ですか。");
  });

  it("gives every sensei question a non-empty English translation", () => {
    for (const question of questions) {
      expect(question.englishTranslation.length).toBeGreaterThan(0);
      expect(
        "burmeseTranslation" in question,
        "Burmese stays off Questions until the Eng/MM toggle",
      ).toBe(false);
    }
  });

  it("never contains forbidden exam/verdict terms in any question field", () => {
    const allText = questions
      .map((q) => `${q.japanese} ${q.englishTranslation}`)
      .join(" ");

    for (const term of FORBIDDEN_TERMS) {
      expect(allText).not.toMatch(term);
    }
  });
});
