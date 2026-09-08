import { NextResponse } from "next/server";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

export async function GET() {
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ participantId: null, consented: false });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ participantId: null, consented: false });
  }
  const { data } = await supabase
    .from("participants")
    .select("participant_id, consent_at")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json({
    participantId: data?.participant_id ?? null,
    consented: Boolean(data?.consent_at),
  });
}
