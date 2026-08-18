/**
 * Wispr STT (Issue 7) — optional key. Absence means the client falls
 * back to the browser SpeechRecognition API instead, so we do NOT
 * `requireEnv` this one.
 */
const WISPR_API_KEY = process.env.WISPR_API_KEY;

export function getWisprKey(): string | undefined {
  return WISPR_API_KEY;
}
