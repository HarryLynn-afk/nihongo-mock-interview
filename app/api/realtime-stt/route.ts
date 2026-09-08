import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getOpenAISttKey } from "@/lib/server/env/openaiStt";
import { mintTranscriptionClientSecret } from "./mintClientSecret";

function guestSafetyIdentifier(): string {
  return createHash("sha256")
    .update(`guest:${randomUUID()}`)
    .digest("hex");
}

export async function POST() {
  const apiKey = getOpenAISttKey();
  if (!apiKey) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const minted = await mintTranscriptionClientSecret({
    apiKey,
    fetchImpl: fetch,
    safetyIdentifier: guestSafetyIdentifier(),
  });
  if (!minted) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ value: minted.value });
}
