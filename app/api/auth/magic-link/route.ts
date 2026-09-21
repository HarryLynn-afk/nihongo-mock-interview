import { NextResponse } from "next/server";

/**
 * Magic-link Participant login is removed. Google-only on /login and /join.
 * Old bookmarks get a clear gone response and never trigger OTP/SMTP.
 */
export async function POST() {
  return NextResponse.json({ error: "gone" }, { status: 410 });
}
