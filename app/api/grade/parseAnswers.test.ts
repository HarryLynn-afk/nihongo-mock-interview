import { describe, expect, it } from "vitest";
import { parseAnswers } from "./parseAnswers";

const VALID_ROW = {
  questionIndex: 0,
  questionId: 1,
  topic: "selfIntroduction",
  questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
  transcript: "はい。",
  pushbackCount: 0,
};

describe("parseAnswers", () => {
  it("rejects a row with an invalid pushbackCount", () => {
    expect(parseAnswers([{ ...VALID_ROW, pushbackCount: 3 }])).toBeNull();
  });

  it("rejects a row that is missing pushbackCount", () => {
    const { pushbackCount, ...row } = VALID_ROW;
    expect(pushbackCount).toBe(0);
    expect(parseAnswers([row])).toBeNull();
  });

  it("rejects a row that is missing transcript", () => {
    const { transcript, ...row } = VALID_ROW;
    expect(transcript).toBe("はい。");
    expect(parseAnswers([row])).toBeNull();
  });

  it("rejects a row that is missing its questionId", () => {
    const { questionId, ...row } = VALID_ROW;
    expect(questionId).toBe(1);
    expect(parseAnswers([row])).toBeNull();
  });

  it("rejects a row that is missing its topic", () => {
    const { topic, ...row } = VALID_ROW;
    expect(topic).toBe("selfIntroduction");
    expect(parseAnswers([row])).toBeNull();
  });

  it("rejects a row without the Japanese question, so relevance cannot be guessed", () => {
    const { questionJapanese, ...row } = VALID_ROW;
    expect(questionJapanese).toBeTruthy();
    expect(parseAnswers([row])).toBeNull();
    expect(parseAnswers([{ ...VALID_ROW, questionJapanese: "   " }])).toBeNull();
  });

  it("keeps the question context and pushbackCount on a valid row", () => {
    expect(parseAnswers([{ ...VALID_ROW, pushbackCount: 1 }])).toEqual([
      { ...VALID_ROW, pushbackCount: 1 },
    ]);
  });

  it("keeps a null topic when the question is outside the topic bank", () => {
    expect(parseAnswers([{ ...VALID_ROW, topic: null }])).toEqual([
      { ...VALID_ROW, topic: null },
    ]);
  });

  it("rejects an empty answers array", () => {
    expect(parseAnswers([])).toBeNull();
  });

  it("keeps a valid row even when leftover inputMode and forced fields are present", () => {
    expect(
      parseAnswers([
        {
          ...VALID_ROW,
          inputMode: "typed",
          forced: true,
        },
      ]),
    ).toEqual([VALID_ROW]);
  });

  it("keeps the first row when two answers share a questionIndex", () => {
    expect(
      parseAnswers([
        { ...VALID_ROW, transcript: "こんにちは。" },
        { ...VALID_ROW, transcript: "こんにちは。" },
        {
          ...VALID_ROW,
          questionIndex: 2,
          questionId: 3,
          topic: "studyPlan",
          questionJapanese: "日本語学校を卒業した後は、何をする予定ですか。",
          transcript: "はい。",
        },
      ]),
    ).toEqual([
      { ...VALID_ROW, transcript: "こんにちは。" },
      {
        ...VALID_ROW,
        questionIndex: 2,
        questionId: 3,
        topic: "studyPlan",
        questionJapanese: "日本語学校を卒業した後は、何をする予定ですか。",
        transcript: "はい。",
      },
    ]);
  });
});
