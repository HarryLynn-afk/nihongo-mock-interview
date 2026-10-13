import type { InterviewReport } from "@/lib/content/sampleReport";
import type { createStudyAdminClient } from "./adminClients";

export type SavedSessionLookup =
  | { state: "missing" }
  | { state: "unavailable" }
  | { state: "other-participant" }
  | { state: "saved"; report: InterviewReport };

export async function readSavedSessionReport({
  admin,
  attemptId,
  participantId,
}: {
  admin: NonNullable<ReturnType<typeof createStudyAdminClient>>;
  attemptId: string;
  participantId: string;
}): Promise<SavedSessionLookup> {
  const existing = await admin.from("study_sessions")
    .select("participant_id, report").eq("attempt_id", attemptId).maybeSingle();
  if (existing.error) return { state: "unavailable" };
  if (!existing.data) return { state: "missing" };
  if (existing.data.participant_id !== participantId) {
    return { state: "other-participant" };
  }
  return { state: "saved", report: existing.data.report as InterviewReport };
}
