import { NextResponse } from "next/server";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

/**
 * Dev-only diagnostic: which email (if any) the current Supabase session
 * belongs to. Not available in production; the private Tester account page
 * now shows the signed-in email directly to its owner.
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
