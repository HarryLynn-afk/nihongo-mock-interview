import { describe, expect, it } from "vitest";
import { pitchAnswers } from "./pitchAnswers";

const FORBIDDEN_TERMS = [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/];

describe("pitchAnswers", () => {
  it("has exactly 3 entries keyed by questionIndex 0/1/2 with the locked phone-clip Japanese lines", () => {
    expect(pitchAnswers).toHaveLength(3);

    const byIndex = [...pitchAnswers].sort((a, b) => a.questionIndex - b.questionIndex);
    expect(byIndex.map((a) => a.questionIndex)).toEqual([0, 1, 2]);

    expect(byIndex[0].japanese).toBe(
      "アウン・ミン・タントです。23歳、マンダレーから来ました。コンピューターを勉強しました。ITの専門学校に行きたいです。",
    );
    expect(byIndex[1].japanese).toBe(
      "東京パスウェイは秋葉原の近くです。ITの進路指導があります。この学校で日本語を勉強したいです。",
    );
    expect(byIndex[2].japanese).toBe(
      "専門学校でウェブを勉強します。そのあとエンジニアになりたいです。",
    );
  });

  it("gives every pitch answer a non-empty English and Burmese line", () => {
    for (const answer of pitchAnswers) {
      expect(answer.english.length).toBeGreaterThan(0);
      expect(answer.burmese.length).toBeGreaterThan(0);
    }
  });

  it("never contains forbidden exam/verdict terms in any field", () => {
    const allText = pitchAnswers
      .map((a) => `${a.japanese} ${a.english} ${a.burmese}`)
      .join(" ");

    for (const term of FORBIDDEN_TERMS) {
      expect(allText).not.toMatch(term);
    }
  });
});
