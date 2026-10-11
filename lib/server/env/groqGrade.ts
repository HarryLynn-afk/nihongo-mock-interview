import { requireEnv } from "./requireEnv";

/** Interview grading through /api/score — never used for translation. */
const GROQ_GRADE_API_KEY = requireEnv("GROQ_GRADE_API_KEY");

export function getGroqGradeKey(): string {
  return GROQ_GRADE_API_KEY;
}
