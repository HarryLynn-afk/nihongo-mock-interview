import type { GradeAnswer } from "./runGroqGrade";

export function parseAnswers(value: unknown): GradeAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 13) return null;
  const answers: GradeAnswer[] = [];
  const seen = new Set<number>();
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (
      typeof row.questionIndex !== "number" ||
      typeof row.questionId !== "number" ||
      row.topic === undefined ||
      (row.topic !== null &&
        (typeof row.topic !== "string" || row.topic.trim() === "" || row.topic.length > 80)) ||
      typeof row.questionJapanese !== "string" ||
      row.questionJapanese.trim() === "" ||
      row.questionJapanese.length > 1000 ||
      typeof row.transcript !== "string" ||
      row.transcript.length > 4000
    ) {
      return null;
    }
    if (row.pushbackCount !== 0 && row.pushbackCount !== 1 && row.pushbackCount !== 2) {
      return null;
    }
    if (seen.has(row.questionIndex)) continue;
    seen.add(row.questionIndex);
    answers.push({
      questionIndex: row.questionIndex,
      questionId: row.questionId,
      topic: row.topic as GradeAnswer["topic"],
      questionJapanese: row.questionJapanese,
      transcript: row.transcript,
      pushbackCount: row.pushbackCount,
    });
  }
  return answers;
}
