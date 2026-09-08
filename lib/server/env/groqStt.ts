import { requireEnv } from "./requireEnv";

/** /api/scribe Groq Whisper only — never used for grade or translate. */
const GROQ_STT_API_KEY = requireEnv("GROQ_STT_API_KEY");

export function getGroqSttKey(): string {
  return GROQ_STT_API_KEY;
}
