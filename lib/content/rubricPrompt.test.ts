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

  it("tells the grader not to score pronunciation on typed answers", () => {
    const prompt = getRubricPrompt();

    expect(prompt).toMatch(/typed/i);
    expect(prompt).toMatch(/pronunciation/i);
    expect(prompt).toMatch(/です\/ます/);
  });

  it("scores consistency from the three answers agreeing, not a written profile", () => {
    const prompt = getRubricPrompt();

    expect(prompt).toMatch(/consistency:.*three answers/i);
    expect(prompt).not.toMatch(/written profile/i);
  });
});
