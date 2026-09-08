import { NextResponse } from "next/server";
import { getGroqSttKey } from "@/lib/server/env/groqStt";
import { whisperSpeech } from "./whisperSpeech";

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

  const transcript = await whisperSpeech({
    audio,
    whisperFetch: fetch,
    getSttKey: getGroqSttKey,
  });

  return NextResponse.json({ transcript });
}
