import { describe, expect, it } from "vitest";
import { transcriptPassesPushbackCheck } from "./pushbackCheck";

describe("transcriptPassesPushbackCheck", () => {
  it("passes はい as real Japanese of at least two characters", () => {
    expect(transcriptPassesPushbackCheck("はい")).toBe(true);
  });

  it("fails an empty transcript as freeze", () => {
    expect(transcriptPassesPushbackCheck("")).toBe(false);
  });

  it("fails spaces-only as empty after trim", () => {
    expect(transcriptPassesPushbackCheck("   ")).toBe(false);
  });

  it("fails a single kana as shorter than two characters", () => {
    expect(transcriptPassesPushbackCheck("あ")).toBe(false);
  });

  it("fails Kanji-only text because Kanji overlaps Chinese Hanzi", () => {
    expect(transcriptPassesPushbackCheck("你好")).toBe(false);
  });

  it("fails English-only text with no kana", () => {
    expect(transcriptPassesPushbackCheck("hello")).toBe(false);
  });

  it("passes mixed English and kana of at least two characters", () => {
    expect(transcriptPassesPushbackCheck("hello はい")).toBe(true);
  });
});
