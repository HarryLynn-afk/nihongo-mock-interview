import { requireEnv } from "./requireEnv";

/** /api/grade fallback only (Issue 11) — never used for translation. */
const GEMINI_GRADE_API_KEY = requireEnv("GEMINI_GRADE_API_KEY");

export function getGeminiGradeKey(): string {
  return GEMINI_GRADE_API_KEY;
}
