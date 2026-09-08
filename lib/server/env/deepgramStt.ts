/**
 * Deepgram Nova-3 live Japanese captions. Optional — absence means Speak
 * fail-opens to browser captions + Groq Whisper after Submit, so we do
 * NOT `requireEnv` this one.
 */
const DEEPGRAM_STT_API_KEY = process.env.DEEPGRAM_STT_API_KEY;

export function getDeepgramSttKey(): string | undefined {
  return DEEPGRAM_STT_API_KEY;
}
