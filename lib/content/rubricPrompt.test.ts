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

  it("tells the grader never to score pronunciation from a transcript", () => {
    const prompt = getRubricPrompt();

    expect(prompt).toMatch(/pronunciation/i);
    expect(prompt).toMatch(/ignored/i);
    expect(prompt).toMatch(/です\/ます/);
  });

  it("asks for quoted critiques per Question, not unconstrained coaching notes", () => {
    const prompt = getRubricPrompt();

    expect(prompt).toMatch(/quote/i);
    expect(prompt).toMatch(/explanation/i);
    expect(prompt).toMatch(/rewrite/i);
    expect(prompt).toMatch(/category/i);
    expect(prompt).not.toMatch(/"coaching"/);
  });

  it("tells the grader the transcripts are live speech captions and not to invent a cleaner transcript", () => {
    const prompt = getRubricPrompt();

    expect(prompt).toMatch(/live (speech )?caption|speech-to-text|ASR/i);
    expect(prompt).toMatch(/do not (punish|penalize).*(glitch|error|artifact)/i);
    expect(prompt).toMatch(/do not invent.*(cleaner|corrected) transcript/i);
    expect(prompt).toMatch(/quote.*(must|only).*(from|submitted)/i);
  });
});
