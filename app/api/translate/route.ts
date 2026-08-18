import { NextResponse } from "next/server";
import { getGroqTranslateKey } from "@/lib/server/env/groqTranslate";
import { translateJapanese } from "./translateJapanese";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const japanese =
    typeof body === "object" && body !== null && "japanese" in body
      ? (body as { japanese: unknown }).japanese
      : undefined;

  if (typeof japanese !== "string" || japanese.trim().length === 0) {
    return NextResponse.json({ error: "Missing japanese" }, { status: 400 });
  }

  const english = await translateJapanese({
    japanese,
    groqFetch: fetch,
    getTranslateKey: getGroqTranslateKey,
  });

  return NextResponse.json({ english });
}
