import { requireEnv } from "./requireEnv";

/** /api/translate only (Issue 8) — never used for grading. */
const GEMINI_TRANSLATE_API_KEY = requireEnv("GEMINI_TRANSLATE_API_KEY");

export function getGeminiTranslateKey(): string {
  return GEMINI_TRANSLATE_API_KEY;
}
