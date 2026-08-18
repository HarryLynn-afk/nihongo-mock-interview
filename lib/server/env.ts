function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Each provider key is scoped to exactly one purpose — never shared
// across features, even though they may come from the same ElevenLabs
// or Gemini account. See .env.example for which issue uses which key.
const ELEVENLABS_TTS_API_KEY = requireEnv("ELEVENLABS_TTS_API_KEY");
const ELEVENLABS_SCRIBE_API_KEY = requireEnv("ELEVENLABS_SCRIBE_API_KEY");
const GEMINI_TRANSLATE_API_KEY = requireEnv("GEMINI_TRANSLATE_API_KEY");
const GEMINI_GRADE_API_KEY = requireEnv("GEMINI_GRADE_API_KEY");
const N8N_WEBHOOK_URL = requireEnv("N8N_WEBHOOK_URL");
const WISPR_API_KEY = process.env.WISPR_API_KEY;

/** Text-to-speech only (Issue 5) — never used for Scribe. */
export function getElevenLabsTtsKey(): string {
  return ELEVENLABS_TTS_API_KEY;
}

/** Scribe transcription only (Issue 9) — never used for TTS. */
export function getElevenLabsScribeKey(): string {
  return ELEVENLABS_SCRIBE_API_KEY;
}

/** /api/translate only (Issue 8) — never used for grading. */
export function getGeminiTranslateKey(): string {
  return GEMINI_TRANSLATE_API_KEY;
}

/** /api/grade fallback only (Issue 11) — never used for translation. */
export function getGeminiGradeKey(): string {
  return GEMINI_GRADE_API_KEY;
}

export function getN8nWebhookUrl(): string {
  return N8N_WEBHOOK_URL;
}

export function getWisprKey(): string | undefined {
  return WISPR_API_KEY;
}
