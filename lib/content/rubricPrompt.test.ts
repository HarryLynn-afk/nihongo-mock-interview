import { describe, expect, it } from "vitest";
import { getRubricPrompt } from "./rubric";

const CATEGORY_NAMES = [
  "speaking",
  "listening",
  "grammarPoliteness",
  "motivation",
  "studyPlan",
  "consistency",
];

const FORBIDDEN_TERMS = [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/];

describe("getRubricPrompt", () => {
  it("names all six rubric categories and asks for integer scores from 1 to 5", () => {
    const prompt = getRubricPrompt();

    for (const category of CATEGORY_NAMES) {
      expect(prompt).toContain(category);
    }
    expect(prompt).toMatch(/1.*(to|-|–).*5/);
  });

  it("never contains forbidden exam/verdict terms", () => {
    const prompt = getRubricPrompt();

    for (const term of FORBIDDEN_TERMS) {
      expect(prompt).not.toMatch(term);
    }
  });
});
