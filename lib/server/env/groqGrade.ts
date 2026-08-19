import { requireEnv } from "./requireEnv";

/** /api/grade fallback only — never used for translation. */
const GROQ_GRADE_API_KEY = requireEnv("GROQ_GRADE_API_KEY");

export function getGroqGradeKey(): string {
  return GROQ_GRADE_API_KEY;
}
