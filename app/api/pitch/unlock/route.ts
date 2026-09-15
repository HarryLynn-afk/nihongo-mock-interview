import { NextResponse } from "next/server";
import {
  accessKeysMatch,
  PITCH_GATE_COOKIE,
  signPitchGateToken,
} from "@/lib/content/pitchGate";
import { getPitchAccessKey } from "@/lib/server/env/pitchAccess";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: Request) {
  const expected = getPitchAccessKey();
  const body = (await request.json().catch(() => null)) as { key?: unknown } | null;
  const provided = typeof body?.key === "string" ? body.key : "";

  if (!expected || !(await accessKeysMatch(provided, expected))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await signPitchGateToken(expected);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PITCH_GATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
