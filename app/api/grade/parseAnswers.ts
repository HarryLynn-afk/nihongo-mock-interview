import type { GradeAnswer } from "./runGroqGrade";

export function parseAnswers(value: unknown): GradeAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const answers: GradeAnswer[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (typeof row.questionIndex !== "number" || typeof row.transcript !== "string") {
      return null;
    }
    if (row.inputMode !== "voice" && row.inputMode !== "typed") return null;
    if (row.pushbackCount !== 0 && row.pushbackCount !== 1 && row.pushbackCount !== 2) {
      return null;
    }
    if (typeof row.forced !== "boolean") return null;
    if (row.forced && row.pushbackCount !== 2) return null;
    answers.push({
      questionIndex: row.questionIndex,
      inputMode: row.inputMode,
      transcript: row.transcript,
      pushbackCount: row.pushbackCount,
      forced: row.forced,
    });
  }
  return answers;
}
