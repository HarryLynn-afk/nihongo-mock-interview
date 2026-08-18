import { requireEnv } from "./requireEnv";

/** Scribe transcription only (Issue 9) — never used for TTS. */
const ELEVENLABS_SCRIBE_API_KEY = requireEnv("ELEVENLABS_SCRIBE_API_KEY");

export function getElevenLabsScribeKey(): string {
  return ELEVENLABS_SCRIBE_API_KEY;
}
