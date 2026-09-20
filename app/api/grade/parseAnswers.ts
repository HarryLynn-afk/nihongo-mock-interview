import type { GradeAnswer } from "./runGroqGrade";

export function parseAnswers(value: unknown): GradeAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const answers: GradeAnswer[] = [];
  const seen = new Set<number>();
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (typeof row.questionIndex !== "number" || typeof row.transcript !== "string") {
      return null;
    }
    if (row.pushbackCount !== 0 && row.pushbackCount !== 1 && row.pushbackCount !== 2) {
      return null;
    }
    if (seen.has(row.questionIndex)) continue;
    seen.add(row.questionIndex);
    answers.push({
      questionIndex: row.questionIndex,
      transcript: row.transcript,
      pushbackCount: row.pushbackCount,
    });
  }
  return answers;
}
