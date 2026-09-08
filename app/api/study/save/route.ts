import { NextResponse } from "next/server";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

export async function POST(request: Request) {
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ saved: false });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ saved: false });
  }

  const admin = createStudyAdminClient();
  if (!admin) {
    return NextResponse.json({ saved: false });
  }

  const participant = await admin
    .from("participants")
    .select("participant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!participant.data?.participant_id) {
    return NextResponse.json({ saved: false });
  }

  const body = (await request.json().catch(() => null)) as {
    headline?: unknown;
    total?: unknown;
    source?: unknown;
    answers?: unknown;
    scores?: unknown;
    pushbackCount?: unknown;
    followUpCount?: unknown;
  } | null;

  const { error } = await admin.from("study_sessions").insert({
    participant_id: participant.data.participant_id,
    headline: typeof body?.headline === "string" ? body.headline : null,
    total: typeof body?.total === "number" ? body.total : null,
    source: typeof body?.source === "string" ? body.source : null,
    answers: body?.answers ?? [],
    scores: body?.scores ?? null,
    pushback_count: typeof body?.pushbackCount === "number" ? body.pushbackCount : 0,
    follow_up_count: typeof body?.followUpCount === "number" ? body.followUpCount : 0,
  });

  return NextResponse.json({ saved: !error });
}
