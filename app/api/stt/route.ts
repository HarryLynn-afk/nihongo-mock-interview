import { NextResponse } from "next/server";
import { getWisprKey } from "@/lib/server/env/wispr";
import { transcribeSpeech } from "./transcribeSpeech";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const audio =
    typeof body === "object" && body !== null && "audio" in body
      ? (body as { audio: unknown }).audio
      : undefined;

  if (typeof audio !== "string" || audio.length === 0) {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }

  const result = await transcribeSpeech({
    audioBase64: audio,
    wisprFetch: fetch,
    getWisprKey,
  });

  if (!result.ok) {
    return NextResponse.json({ fallback: "browser" });
  }

  return NextResponse.json(result.payload);
}
