import { NextResponse } from "next/server";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

/**
 * Dev-only diagnostic: which email (if any) the current Supabase session
 * belongs to. Never exposed in production — the app's privacy design shows
 * a participant id to testers, never their email.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ email: null }, { status: 404 });
  }
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ email: null });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return NextResponse.json({ email: user?.email ?? null });
}
