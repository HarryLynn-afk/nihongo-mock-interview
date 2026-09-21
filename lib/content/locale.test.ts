import { describe, expect, it } from "vitest";
import {
  helperLinesForLocale,
  isUiLocale,
} from "./locale";

describe("isUiLocale", () => {
  it("accepts only en and my", () => {
    expect(isUiLocale("en")).toBe(true);
    expect(isUiLocale("my")).toBe(true);
    expect(isUiLocale("ja")).toBe(false);
    expect(isUiLocale(null)).toBe(false);
  });
});

describe("helperLinesForLocale", () => {
  const lines = { english: "Hello.", burmese: "မင်္ဂလာပါ။" };

  it("returns English only for en", () => {
    expect(helperLinesForLocale("en", lines)).toEqual({
      english: "Hello.",
      burmese: null,
    });
  });

  it("returns Burmese only for my", () => {
    expect(helperLinesForLocale("my", lines)).toEqual({
      english: null,
      burmese: "မင်္ဂလာပါ။",
    });
  });
});
