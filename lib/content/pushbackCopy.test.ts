import { describe, expect, it } from "vitest";
import { PUSHBACK_TRY_AGAIN, tryAgainLineFor } from "./pushbackCopy";

describe("PUSHBACK_TRY_AGAIN", () => {
  it("locks the one try-again line in Japanese, English, and Burmese", () => {
    expect(PUSHBACK_TRY_AGAIN).toEqual({
      japanese: "すみません、もう一度お願いします。",
      english: "Sorry, could you try answering that again?",
      burmese: "တစ်ဖန်ထပ်ဖြေပေးပါဦးနော်။",
    });
  });
});

describe("tryAgainLineFor", () => {
  it("returns English by default and Burmese when MM is selected", () => {
    expect(tryAgainLineFor()).toBe(PUSHBACK_TRY_AGAIN.english);
    expect(tryAgainLineFor("en")).toBe(PUSHBACK_TRY_AGAIN.english);
    expect(tryAgainLineFor("my")).toBe(PUSHBACK_TRY_AGAIN.burmese);
  });
});
