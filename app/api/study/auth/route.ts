import { NextResponse } from "next/server";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

/**
 * Whether this browser has a Google (Supabase) session. Deliberately separate
 * from `/api/study/me`: it never reads participant or consent data, so a guest
 * can ask "am I signed in?" without looking like a Participant. Fails closed.
 */
export async function GET() {
  try {
    const supabase = await createStudyServerClient();
    if (!supabase) return NextResponse.json({ signedIn: false });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return NextResponse.json({ signedIn: Boolean(user) });
  } catch {
    return NextResponse.json({ signedIn: false });
  }
}
