import { describe, expect, it } from "vitest";
import { RUBRIC_CATEGORY_KEYS } from "./rubric";
import { parseQuotedCritiques } from "./parseQuotedCritiques";

describe("parseQuotedCritiques", () => {
  it("accepts every category key the rubric defines", () => {
    for (const category of RUBRIC_CATEGORY_KEYS) {
      expect(
        parseQuotedCritiques(
          [
            {
              questionIndex: 0,
              quote: "はじめまして",
              explanation: "Clear self-introduction.",
              rewrite: "はじめまして",
              category,
            },
          ],
          [{ questionIndex: 0, transcript: "はじめまして。" }],
        ),
      ).toEqual([
        {
          questionIndex: 0,
          quote: "はじめまして",
          explanation: "Clear self-introduction.",
          rewrite: "はじめまして",
          category,
        },
      ]);
    }
  });

  it("rejects old coaching-only JSON as a miss", () => {
    expect(
      parseQuotedCritiques(undefined, [
        { questionIndex: 0, transcript: "はじめまして。" },
      ]),
    ).toBeNull();
  });

  it("rejects a fabricated quote that is not a substring of the transcript", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "東京に行きたいです",
            explanation: "Invented phrase.",
            rewrite: "はじめまして。",
            category: "answerRelevance",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。" }],
      ),
    ).toBeNull();
  });

  it("allows （無言） only when the stored transcript is empty after trim", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "（無言）",
            explanation: "No spoken answer.",
            rewrite: "はじめまして。アウンミンハントです。",
            category: "contentCompleteness",
          },
        ],
        [{ questionIndex: 0, transcript: "  " }],
      ),
    ).toEqual([
      {
        questionIndex: 0,
        quote: "（無言）",
        explanation: "No spoken answer.",
        rewrite: "はじめまして。アウンミンハントです。",
        category: "contentCompleteness",
      },
    ]);
  });

  it("rejects a category that is not a RubricCategoryKey", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "はじめまして",
            explanation: "Clear self-introduction.",
            rewrite: "はじめまして",
            category: "fluency",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。" }],
      ),
    ).toBeNull();
  });

  it("rejects （無言） as a rewrite", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "はじめまして",
            explanation: "No spoken answer.",
            rewrite: "（無言）",
            category: "japaneseClarity",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。" }],
      ),
    ).toBeNull();
  });

  it("rejects two critiques for the same Question when two answers were stored", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "はい",
            explanation: "First.",
            rewrite: "はい。",
            category: "answerRelevance",
          },
          {
            questionIndex: 0,
            quote: "はい",
            explanation: "Duplicate index.",
            rewrite: "はい。",
            category: "contentCompleteness",
          },
        ],
        [
          { questionIndex: 0, transcript: "はい。" },
          { questionIndex: 1, transcript: "ええ。" },
        ],
      ),
    ).toBeNull();
  });

  it("rejects an empty quote on a non-empty transcript", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "",
            explanation: "Missing quote.",
            rewrite: "はじめまして。",
            category: "grammarPoliteness",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。" }],
      ),
    ).toBeNull();
  });

  it("accepts one critique per stored answer when a Question was skipped", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "はじめまして",
            explanation: "Clear self-introduction.",
            rewrite: "はじめまして。",
            category: "japaneseClarity",
          },
          {
            questionIndex: 2,
            quote: "専門学校",
            explanation: "Name a next step.",
            rewrite: "専門学校でウェブを勉強します。",
            category: "contentCompleteness",
          },
        ],
        [
          { questionIndex: 0, transcript: "はじめまして。" },
          { questionIndex: 2, transcript: "専門学校に行きます。" },
        ],
      ),
    ).toHaveLength(2);
  });

  it("rejects an eligibility claim on a financialSupport answer", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "アルバイト",
            explanation: "You are eligible for a scholarship.",
            rewrite: "アルバイトをします。",
            category: "answerRelevance",
          },
        ],
        [
          {
            questionIndex: 0,
            transcript: "アルバイトをします",
            topic: "financialSupport",
          },
        ],
      ),
    ).toBeNull();
  });

  it("rejects a visa or admission claim on a financialSupport answer", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "母",
            explanation: "Your mother's income supports your visa.",
            rewrite: "母が支援します。",
            category: "contentCompleteness",
          },
        ],
        [
          {
            questionIndex: 0,
            transcript: "母が支援します",
            topic: "financialSupport",
          },
        ],
      ),
    ).toBeNull();
  });

  it("keeps the financial guard scoped to financialSupport topics", () => {
    const critique = {
      questionIndex: 0,
      quote: "専門学校",
      explanation: "Your visa plan is clear.",
      rewrite: "専門学校でウェブを勉強します。",
      category: "contentCompleteness" as const,
    };

    expect(
      parseQuotedCritiques(
        [critique],
        [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
      ),
    ).toEqual([critique]);
  });

  it("accepts a financialSupport answer with no eligibility claim", () => {
    const critique = {
      questionIndex: 0,
      quote: "アルバイト",
      explanation: "You named a part-time job as your support.",
      rewrite: "アルバイトをします。",
      category: "contentCompleteness" as const,
    };

    expect(
      parseQuotedCritiques(
        [critique],
        [
          {
            questionIndex: 0,
            transcript: "アルバイトをします",
            topic: "financialSupport",
          },
        ],
      ),
    ).toEqual([critique]);
  });
});
