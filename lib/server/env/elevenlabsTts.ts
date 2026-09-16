import { requireEnv } from "./requireEnv";

/** Generate-time TTS only — runtime sensei audio is committed mp3s. Never used for Scribe. */
const ELEVENLABS_TTS_API_KEY = requireEnv("ELEVENLABS_TTS_API_KEY");

export function getElevenLabsTtsKey(): string {
  return ELEVENLABS_TTS_API_KEY;
}
