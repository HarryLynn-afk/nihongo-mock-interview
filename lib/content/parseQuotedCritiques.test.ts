import { describe, expect, it } from "vitest";
import { parseQuotedCritiques } from "./parseQuotedCritiques";

describe("parseQuotedCritiques", () => {
  it("rejects old coaching-only JSON as a miss", () => {
    expect(
      parseQuotedCritiques(undefined, [
        { questionIndex: 0, transcript: "はじめまして。", forced: false },
      ]),
    ).toBeNull();
  });

  it("keeps a critique whose quote is an exact substring of the stored transcript", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "はじめまして",
            explanation: "Clear self-introduction.",
            rewrite: "はじめまして",
            category: "speaking",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。", forced: false }],
      ),
    ).toEqual([
      {
        questionIndex: 0,
        quote: "はじめまして",
        explanation: "Clear self-introduction.",
        rewrite: "はじめまして",
        category: "speaking",
      },
    ]);
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
            category: "listening",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。", forced: false }],
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
            category: "speaking",
          },
        ],
        [{ questionIndex: 0, transcript: "  ", forced: true }],
      ),
    ).toEqual([
      {
        questionIndex: 0,
        quote: "（無言）",
        explanation: "No spoken answer.",
        rewrite: "はじめまして。アウンミンハントです。",
        category: "speaking",
      },
    ]);
  });

  it("rejects forced true when rewrite equals quote", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "hello",
            explanation: "Forced through.",
            rewrite: "hello",
            category: "speaking",
          },
        ],
        [{ questionIndex: 0, transcript: "hello", forced: true }],
      ),
    ).toBeNull();
  });

  it("rejects forced true when rewrite has no Hiragana or Katakana", () => {
    expect(
      parseQuotedCritiques(
        [
          {
            questionIndex: 0,
            quote: "hello",
            explanation: "Forced through.",
            rewrite: "HELLO",
            category: "speaking",
          },
        ],
        [{ questionIndex: 0, transcript: "hello", forced: true }],
      ),
    ).toBeNull();
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
        [{ questionIndex: 0, transcript: "はじめまして。", forced: false }],
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
            category: "speaking",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。", forced: false }],
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
            category: "speaking",
          },
          {
            questionIndex: 0,
            quote: "はい",
            explanation: "Duplicate index.",
            rewrite: "はい。",
            category: "listening",
          },
        ],
        [
          { questionIndex: 0, transcript: "はい。", forced: false },
          { questionIndex: 1, transcript: "ええ。", forced: false },
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
            category: "speaking",
          },
        ],
        [{ questionIndex: 0, transcript: "はじめまして。", forced: false }],
      ),
    ).toBeNull();
  });
});
