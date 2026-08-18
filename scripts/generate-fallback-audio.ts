/**
 * One-off dev script — NOT part of the app runtime.
 * Generates the 3 local .mp3 fallback clips for Issue 5 (used when the
 * live ElevenLabs TTS stream exceeds 1.5s latency). Run once, commit the
 * resulting files, re-run only if lib/content/questions.ts changes.
 *
 * Usage: node --env-file=.env.local scripts/generate-fallback-audio.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { questions } from "../lib/content/questions.ts";

const API_KEY = process.env.ELEVENLABS_TTS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_TTS_API_KEY in environment.");
  process.exit(1);
}

type Voice = { voice_id: string; name: string; labels?: Record<string, string> };

async function pickVoiceId(): Promise<string> {
  const override = process.env.ELEVENLABS_VOICE_ID;
  if (override) return override;

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": API_KEY! },
  });
  if (!res.ok) {
    throw new Error(`Failed to list voices: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { voices: Voice[] };
  if (!data.voices?.length) {
    throw new Error("No voices available on this ElevenLabs account.");
  }

  const preferred =
    data.voices.find((v) => v.labels?.gender === "female") ?? data.voices[0];
  console.log(`Using voice: ${preferred.name} (${preferred.voice_id})`);
  return preferred.voice_id;
}

async function generateClip(voiceId: string, text: string, outPath: string) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY!,
      "Content-Type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });
  if (!res.ok) {
    throw new Error(`TTS failed (${res.status}): ${await res.text()}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`Saved ${outPath} (${buffer.length} bytes)`);
}

async function main() {
  const voiceId = await pickVoiceId();
  for (const question of questions) {
    const outPath = path.resolve(
      import.meta.dirname,
      "..",
      "public",
      `question-${question.id}.mp3`,
    );
    await generateClip(voiceId, question.japanese, outPath);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
