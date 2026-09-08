import { NextResponse } from "next/server";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = "/consent";

  if (code) {
    const supabase = await createStudyServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
