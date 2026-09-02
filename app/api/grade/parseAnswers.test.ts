import { describe, expect, it } from "vitest";
import { parseAnswers } from "./parseAnswers";

describe("parseAnswers", () => {
  it("rejects a row with an invalid pushbackCount", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          inputMode: "typed",
          transcript: "はい。",
          pushbackCount: 3,
          forced: false,
        },
      ]),
    ).toBeNull();
  });

  it("rejects a row that is missing pushbackCount", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          inputMode: "typed",
          transcript: "はい。",
          forced: false,
        },
      ]),
    ).toBeNull();
  });

  it("rejects a row that is missing forced", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          inputMode: "typed",
          transcript: "はい。",
          pushbackCount: 0,
        },
      ]),
    ).toBeNull();
  });

  it("rejects forced true when pushbackCount is not 2", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          inputMode: "typed",
          transcript: "hello",
          pushbackCount: 0,
          forced: true,
        },
      ]),
    ).toBeNull();
  });

  it("keeps pushbackCount and forced on a valid row", () => {
    expect(
      parseAnswers([
        {
          questionIndex: 0,
          inputMode: "typed",
          transcript: "はい。",
          pushbackCount: 1,
          forced: false,
        },
      ]),
    ).toEqual([
      {
        questionIndex: 0,
        inputMode: "typed",
        transcript: "はい。",
        pushbackCount: 1,
        forced: false,
      },
    ]);
  });
});
