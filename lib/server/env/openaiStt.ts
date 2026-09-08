/**
 * OpenAI live transcription (Realtime). Optional — absence means Speak
 * fail-opens to browser captions + Groq Whisper after Submit, so we do
 * NOT `requireEnv` this one.
 */
const OPENAI_STT_API_KEY = process.env.OPENAI_STT_API_KEY;

export function getOpenAISttKey(): string | undefined {
  return OPENAI_STT_API_KEY;
}
