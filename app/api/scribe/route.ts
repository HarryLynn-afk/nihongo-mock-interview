import { NextResponse } from "next/server";
import { getElevenLabsScribeKey } from "@/lib/server/env/elevenlabsScribe";
import { scribeSpeech } from "./scribeSpeech";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }

  const audioBytes = new Uint8Array(await audio.arrayBuffer());
  const transcript = await scribeSpeech({
    audioBytes,
    scribeFetch: fetch,
    getScribeKey: getElevenLabsScribeKey,
  });

  return NextResponse.json({ transcript });
}
