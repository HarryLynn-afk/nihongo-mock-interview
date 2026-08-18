import { requireEnv } from "./requireEnv";

/** /api/translate only (Issue 8) — never used for grading. */
const GROQ_TRANSLATE_API_KEY = requireEnv("GROQ_TRANSLATE_API_KEY");

export function getGroqTranslateKey(): string {
  return GROQ_TRANSLATE_API_KEY;
}
