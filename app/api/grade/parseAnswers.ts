import type { GradeAnswer } from "./runGeminiGrade";

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
    answers.push({
      questionIndex: row.questionIndex,
      inputMode: row.inputMode,
      transcript: row.transcript,
    });
  }
  return answers;
}
