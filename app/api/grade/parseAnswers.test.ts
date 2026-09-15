import { describe, expect, it } from "vitest";
import { parseAnswers } from "./parseAnswers";

describe("parseAnswers", () => {
  it("rejects a row with an invalid pushbackCount", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          transcript: "はい。",
          pushbackCount: 3,
        },
      ]),
    ).toBeNull();
  });

  it("rejects a row that is missing pushbackCount", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          transcript: "はい。",
        },
      ]),
    ).toBeNull();
  });

  it("rejects a row that is missing transcript", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          pushbackCount: 0,
        },
      ]),
    ).toBeNull();
  });

  it("keeps pushbackCount on a valid row", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          transcript: "はい。",
          pushbackCount: 1,
        },
      ]),
    ).toEqual([
      {
        questionIndex: 0,
        transcript: "はい。",
        pushbackCount: 1,
      },
    ]);
  });

  it("rejects an empty answers array", () => {
    expect(parseAnswers([])).toBeNull();
  });

  it("keeps a valid row even when leftover inputMode and forced fields are present", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          transcript: "はい。",
          pushbackCount: 0,
          inputMode: "typed",
          forced: true,
        },
      ]),
    ).toEqual([
      {
        questionIndex: 0,
        transcript: "はい。",
        pushbackCount: 0,
      },
    ]);
  });
});
