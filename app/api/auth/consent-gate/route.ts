import { NextResponse } from "next/server";
import { consentGateCookie } from "@/lib/content/studyAuth";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

export async function POST() {
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  const gate = consentGateCookie(true);
  response.cookies.set(gate.name, gate.value, gate.options);
  return response;
}
