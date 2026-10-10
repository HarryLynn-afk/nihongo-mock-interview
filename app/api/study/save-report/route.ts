import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withApiGuard } from "@/lib/server/security/guard";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { saveSessionReport } from "@/lib/server/study/saveSessionReport";
import { readStudySaveReceipt } from "@/lib/server/study/scoreAttempt";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "@/lib/server/study/visitConsent";

export const POST = withApiGuard(async (request) => {
  let body: { saveReceipt?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const supabase = await createStudyServerClient();
  const user = supabase && (await supabase.auth.getUser()).data.user;
  if (!user || typeof body?.saveReceipt !== "string") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  if (!(await hasVisitConsent(user.id, jar.get(VISIT_ID_COOKIE)?.value,
    jar.get(VISIT_CONSENT_COOKIE)?.value))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const payload = await readStudySaveReceipt(user.id, body.saveReceipt);
  if (!payload) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createStudyAdminClient();
  if (!admin) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const participant = await admin.from("participants")
    .select("participant_id").eq("id", user.id).maybeSingle();
  const participantId = participant.data?.participant_id;
  if (!participantId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const existing = await admin.from("study_sessions")
    .select("participant_id, report").eq("attempt_id", payload.attemptId).maybeSingle();
  if (existing.error) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (existing.data) {
    if (existing.data.participant_id !== participantId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ report: existing.data.report, studySave: "saved" });
  }
  const { report, answers } = payload;
  const saved = await saveSessionReport({
    admin, attemptId: payload.attemptId, participantId, report, answers,
  });
  if (!saved) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return NextResponse.json({ report, studySave: "saved" });
}, "write");
