import { NextResponse } from "next/server";
import { getDeepgramSttKey } from "@/lib/server/env/deepgramStt";
import { mintDeepgramListenToken } from "./mintListenToken";

export async function POST() {
  const apiKey = getDeepgramSttKey();
  if (!apiKey) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const minted = await mintDeepgramListenToken({
    apiKey,
    fetchImpl: fetch,
  });
  if (!minted) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ accessToken: minted.accessToken });
}
