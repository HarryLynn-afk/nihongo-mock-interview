/**
 * One-off dev script — NOT part of the app runtime.
 * Pre-renders public/question-{id}.mp3 for every playable Question
 * (Pitch 1–3, question bank, follow-ups). The call page plays those
 * files directly; live ElevenLabs is generate-time only.
 *
 * Skips ids that already have a clip. Re-run after Japanese copy
 * changes (delete the old file first to regenerate).
 *
 * Usage: node --env-file=.env.local scripts/generate-fallback-audio.ts
 */
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { questions } from "../lib/content/questions.ts";
import { followUpBank, questionBank } from "../lib/content/questionBank.ts";
import type { InterviewQuestion } from "../lib/content/questions.ts";

function allPlayableQuestions(): InterviewQuestion[] {
  const byId = new Map<number, InterviewQuestion>();
  for (const question of [...questions, ...questionBank, ...followUpBank]) {
    byId.set(question.id, question);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

const API_KEY = process.env.ELEVENLABS_TTS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_TTS_API_KEY in environment.");
  process.exit(1);
}

// Sarah — same voice as the committed Pitch clips.
const SENSEI_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateClip(text: string, outPath: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${SENSEI_VOICE_ID}`,
    {
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
    },
  );
  if (!res.ok) {
    throw new Error(`TTS failed (${res.status}) for ${path.basename(outPath)}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`Saved ${path.basename(outPath)} (${buffer.length} bytes)`);
}

async function main() {
  const playable = allPlayableQuestions();
  console.log(`Playable Questions: ${playable.length}`);
  console.log(`Using locked Sarah voice ${SENSEI_VOICE_ID}`);

  let generated = 0;
  let skipped = 0;
  for (const question of playable) {
    const outPath = path.resolve(
      import.meta.dirname,
      "..",
      "public",
      `question-${question.id}.mp3`,
    );
    if (await fileExists(outPath)) {
      console.log(`Skip existing question-${question.id}.mp3`);
      skipped += 1;
      continue;
    }
    await generateClip(question.japanese, outPath);
    generated += 1;
  }

  console.log(`Done. generated=${generated} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
