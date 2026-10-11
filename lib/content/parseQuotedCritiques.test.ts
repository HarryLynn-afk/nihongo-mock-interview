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

  it("rejects explicit visa eligibility on a studyPlan answer", () => {
    expect(parseQuotedCritiques(
      [{
        questionIndex: 0,
        quote: "専門学校",
        explanation: "You are eligible for a visa.",
        rewrite: "専門学校でウェブを勉強します。",
        category: "contentCompleteness",
      }],
      [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
    )).toBeNull();
  });

  it("allows neutral visa coaching outside financialSupport topics", () => {
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

  it("rejects a Japanese visa eligibility claim in a financial rewrite", () => {
    expect(parseQuotedCritiques(
      [{
        questionIndex: 0,
        quote: "母",
        explanation: "You named your mother as your support.",
        rewrite: "母が支援するので、留学ビザを取得できます。",
        category: "contentCompleteness",
      }],
      [{ questionIndex: 0, transcript: "母が支援します", topic: "financialSupport" }],
    )).toBeNull();
  });

  it("rejects Japanese eligibility judgments across topics and output fields", () => {
    for (const topic of ["studyPlan", "financialSupport", null]) {
      for (const field of ["explanation", "rewrite"]) {
        for (const claim of [
          "入学資格があります。",
          "入学資格がありません。",
          "留学ビザを取得できません。",
          "留学ビザを取得することができます。",
          "COEが発行されます。",
          "在留資格の要件を満たしています。",
          "奨学金を受ける資格があります。",
          "ビザが許可されます。",
          "ビザは必ず発給されます。",
          "留学ビザの申請が承認されます。",
          "COEは確実に発行されます。",
          "入学できます。",
          "入学できません。",
          "在留資格が認められます。",
          "ＣＯＥが発行されます。",
          "経済的な条件を満たしています。",
        ]) {
          expect(parseQuotedCritiques(
            [{
              questionIndex: 0,
              quote: "専門学校",
              explanation: "You named your next study step.",
              rewrite: "専門学校でウェブを勉強します。",
              category: "contentCompleteness",
              [field]: claim,
            }],
            [{ questionIndex: 0, transcript: "専門学校に行きます", topic }],
          ), `${topic}: ${field}: ${claim}`).toBeNull();
        }
      }
    }
  });

  it("rejects English eligibility judgments and promised outcomes across topics", () => {
    for (const topic of ["studyPlan", "financialSupport", null]) {
      for (const field of ["explanation", "rewrite"]) {
        for (const claim of [
          "You qualify for admission.",
          "You meet the visa requirements.",
          "You are ineligible for a visa.",
          "You are financially eligible.",
          "Your visa will be approved.",
          "Admission is guaranteed.",
          "You will receive a COE.",
        ]) {
          expect(parseQuotedCritiques(
            [{
              questionIndex: 0,
              quote: "専門学校",
              explanation: "You named your next study step.",
              rewrite: "専門学校でウェブを勉強します。",
              category: "contentCompleteness",
              [field]: claim,
            }],
            [{ questionIndex: 0, transcript: "専門学校に行きます", topic }],
          ), `${topic}: ${field}: ${claim}`).toBeNull();
        }
      }
    }
  });

  it("preserves neutral application coaching and eligibility disclaimers", () => {
    for (const [explanation, rewrite] of [
      ["Your visa plan is clear.", "必要な資料を取得できます。"],
      ["Admission is not guaranteed.", "入学資格は学校に確認してください。"],
      ["This practice cannot determine your visa eligibility.", "ビザ申請の手順を説明しましょう。"],
      ["You will receive advice about your visa application.", "ＣＯＥについて学校に確認します。"],
      ["Avoid claiming you are eligible for a visa; explain your study plan instead.", "専門学校で勉強します。"],
      ["Ask the school about its requirements.", "入学できますか、と学校に確認します。"],
    ]) {
      const critique = {
        questionIndex: 0,
        quote: "専門学校",
        explanation,
        rewrite,
        category: "contentCompleteness" as const,
      };
      expect(parseQuotedCritiques(
        [critique],
        [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
      ), explanation).toEqual([critique]);
    }
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

  it("rejects a Japanese assertion followed by an eligibility question", () => {
    for (const field of ["explanation", "rewrite"]) {
      for (const claim of [
        "ビザを取得できますが、COEを取得できますかと学校に確認します。",
        "入学資格がありますが、奨学金を受ける資格がありますかと学校に確認します。",
      ]) {
        expect(parseQuotedCritiques(
          [{
            questionIndex: 0,
            quote: "専門学校",
            explanation: "You named your study plan.",
            rewrite: "専門学校で勉強します。",
            category: "contentCompleteness",
            [field]: claim,
          }],
          [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
        ), `${field}: ${claim}`).toBeNull();
      }
    }
  });

  it("rejects visa acquisition promises with certainty modifiers", () => {
    for (const rewrite of [
      "ビザを必ず取得できます。",
      "COEは確実に取得できます。",
      "在留資格を絶対に取得することができます。",
    ]) {
      expect(parseQuotedCritiques(
        [{
          questionIndex: 0,
          quote: "専門学校",
          explanation: "You named your study plan.",
          rewrite,
          category: "contentCompleteness",
        }],
        [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
      ), rewrite).toBeNull();
    }
  });

  it("preserves advice about obtaining visa application documents", () => {
    const critique = {
      questionIndex: 0,
      quote: "専門学校",
      explanation: "Explain the documents you plan to prepare.",
      rewrite: "ビザ申請に必要な書類を取得できます。",
      category: "contentCompleteness" as const,
    };

    expect(parseQuotedCritiques(
      [critique],
      [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
    )).toEqual([critique]);
  });

  it("preserves document issuance advice without promising a visa outcome", () => {
    for (const field of ["explanation", "rewrite"]) {
      const critique = {
        questionIndex: 0,
        quote: "専門学校",
        explanation: "Explain the documents you plan to prepare.",
        rewrite: "専門学校で勉強します。",
        category: "contentCompleteness" as const,
        [field]: "ビザ申請に必要な証明書が発行されます。",
      };
      expect(parseQuotedCritiques(
        [critique],
        [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
      ), field).toEqual([critique]);
    }
  });

  it("does not let warnings or questions hide another eligibility assertion", () => {
    for (const [explanation, rewrite] of [
      ["Avoid claiming you are eligible for a visa. You are eligible for a visa.", "専門学校で勉強します。"],
      ["Avoid claiming you are eligible for a visa, but you meet the visa requirements.", "専門学校で勉強します。"],
      ["Avoid claiming you are eligible for a visa.", "留学ビザを取得することができます。"],
      ["Avoid claiming you are", "You are eligible for a visa."],
      ["Ask the school about its requirements.", "入学できますか、と確認しますが、入学できます。"],
      ["You named your study plan.", "入学できますから、学費を準備してください。"],
    ]) {
      expect(parseQuotedCritiques(
        [{ questionIndex: 0, quote: "専門学校", explanation, rewrite, category: "contentCompleteness" }],
        [{ questionIndex: 0, transcript: "専門学校に行きます", topic: "studyPlan" }],
      ), `${explanation}: ${rewrite}`).toBeNull();
    }
  });
});
