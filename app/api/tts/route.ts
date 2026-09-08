import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getElevenLabsTtsKey } from "@/lib/server/env/elevenlabsTts";
import { findPlayableQuestion } from "@/lib/content/findPlayableQuestion";
import { resolveQuestionAudio } from "./resolveQuestionAudio";

// Sarah — matches the voice used to pre-render the local fallback clips
// in scripts/generate-fallback-audio.ts, so live and fallback sound the same.
const SENSEI_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const TTS_TIMEOUT_MS = 1500;

async function fetchTts(questionId: number, signal: AbortSignal): Promise<Uint8Array> {
  const question = findPlayableQuestion(questionId);
  if (!question) {
    throw new Error(`Unknown questionId: ${questionId}`);
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${SENSEI_VOICE_ID}`,
    {
      method: "POST",
      signal,
      headers: {
        "xi-api-key": getElevenLabsTtsKey(),
        "Content-Type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: question.japanese,
        model_id: "eleven_multilingual_v2",
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs returned ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function readFallback(questionId: number): Promise<Uint8Array> {
  const filePath = path.join(process.cwd(), "public", `question-${questionId}.mp3`);
  try {
    const buffer = await readFile(filePath);
    return new Uint8Array(buffer);
  } catch {
    throw new Error(`No local fallback for question ${questionId}`);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionId = Number(searchParams.get("questionId"));
  const question = findPlayableQuestion(questionId);

  if (!question) {
    return NextResponse.json(
      { error: `Invalid questionId: ${searchParams.get("questionId")}` },
      { status: 400 },
    );
  }

  const { source, bytes } = await resolveQuestionAudio({
    questionId,
    ttsFetch: fetchTts,
    fallbackReader: readFallback,
    timeoutMs: TTS_TIMEOUT_MS,
    hasFallback: questionId >= 1 && questionId <= 3,
  });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Audio-Source": source, // "tts" or "fallback" — useful for smoke testing
    },
  });
}
