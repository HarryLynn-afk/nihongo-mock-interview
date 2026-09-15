import type { RubricCategoryKey } from "./rubric";

const SILENT_QUOTE = "（無言）";

const CATEGORY_KEYS: RubricCategoryKey[] = [
  "speaking",
  "listening",
  "grammarPoliteness",
  "motivation",
  "studyPlan",
  "consistency",
];

export type CritiqueAnswer = {
  questionIndex: number;
  transcript: string;
};

export type QuotedCritique = {
  questionIndex: number;
  quote: string;
  explanation: string;
  rewrite: string;
  category: RubricCategoryKey;
};

export function parseQuotedCritiques(
  raw: unknown,
  answers: readonly CritiqueAnswer[],
): QuotedCritique[] | null {
  if (!Array.isArray(raw) || raw.length !== answers.length) return null;

  const critiques: QuotedCritique[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (typeof row.questionIndex !== "number") return null;
    if (seen.has(row.questionIndex)) return null;
    seen.add(row.questionIndex);
    if (typeof row.quote !== "string") return null;
    if (typeof row.explanation !== "string") return null;
    if (typeof row.rewrite !== "string") return null;
    if (
      typeof row.category !== "string" ||
      !CATEGORY_KEYS.includes(row.category as RubricCategoryKey)
    ) {
      return null;
    }

    const answer = answers.find((a) => a.questionIndex === row.questionIndex);
    if (!answer) return null;
    const trimmed = answer.transcript.trim();
    if (row.quote === SILENT_QUOTE) {
      if (trimmed !== "") return null;
    } else if (row.quote === "" || !answer.transcript.includes(row.quote)) {
      return null;
    }
    if (row.rewrite === SILENT_QUOTE) return null;

    critiques.push({
      questionIndex: row.questionIndex,
      quote: row.quote,
      explanation: row.explanation,
      rewrite: row.rewrite,
      category: row.category as RubricCategoryKey,
    });
  }
  return critiques;
}
