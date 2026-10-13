import type { InterviewReport } from "@/lib/content/sampleReport";
import type { StudySessionAnswer } from "./scoreAttempt";
import type { createStudyAdminClient } from "./adminClients";

export type SaveSessionResult = "saved" | "conflict" | "failed";

export async function saveSessionReport({
  admin, attemptId, participantId, report, answers,
}: {
  admin: NonNullable<ReturnType<typeof createStudyAdminClient>>;
  attemptId: string;
  participantId: string;
  report: InterviewReport;
  answers: StudySessionAnswer[];
}): Promise<SaveSessionResult> {
  try {
    const { error } = await admin.from("study_sessions").insert({
      attempt_id: attemptId,
      participant_id: participantId,
      report,
      total: report.total,
      source: report.source,
      answers,
      scores: report.scores,
      pushback_count: answers.reduce(
        (sum, answer) => sum + (answer.status === "answered" ? answer.pushbackCount : 0), 0,
      ),
      follow_up_count: answers.filter((answer) => answer.isFollowUp).length,
    });
    if (!error) return "saved";
    // 23505: another request for this attempt saved first.
    return (error as { code?: string }).code === "23505" ? "conflict" : "failed";
  } catch {
    return "failed";
  }
}
