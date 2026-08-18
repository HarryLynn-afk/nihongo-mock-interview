import { requireEnv } from "./requireEnv";

/** Text-to-speech only (Issue 5) — never used for Scribe. */
const ELEVENLABS_TTS_API_KEY = requireEnv("ELEVENLABS_TTS_API_KEY");

export function getElevenLabsTtsKey(): string {
  return ELEVENLABS_TTS_API_KEY;
}
