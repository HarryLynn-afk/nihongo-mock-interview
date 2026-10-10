import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBankQuestionById } from "@/lib/content/questionBank";
import { questions } from "@/lib/content/questions";
import { getDeepseekGradeKey } from "@/lib/server/env/deepseekGrade";
import { getGroqGradeKey } from "@/lib/server/env/groqGrade";
import { withApiGuard } from "@/lib/server/security/guard";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { readStudyAttemptToken } from "@/lib/server/study/scoreAttempt";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "@/lib/server/study/visitConsent";
import { gradeInterview } from "../grade/gradeInterview";
import { parseAnswers } from "../grade/parseAnswers";
import { runDeepseekGrade } from "../grade/runDeepseekGrade";
import { runGroqGrade } from "../grade/runGroqGrade";

/** Groq/DeepSeek grade can be slow; keep the route alive for in-process calls. */
export const maxDuration = 60;

type SessionAnswer = {
  questionIndex: number;
  questionId: number;
  status: "answered" | "skipped";
  transcript: string;
  pushbackCount: 0 | 1 | 2;
  isFollowUp: boolean;
};

function parseSessionAnswers(value: unknown): SessionAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 13) return null;
  const seen = new Set<number>();
  const answers: SessionAnswer[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (
      !Number.isInteger(row.questionIndex) ||
      (row.questionIndex as number) < 0 ||
      (row.questionIndex as number) >= 13 ||
      !Number.isInteger(row.questionId) ||
      (row.status !== "answered" && row.status !== "skipped") ||
      typeof row.transcript !== "string" ||
      row.transcript.length > 4000 ||
      (row.pushbackCount !== 0 && row.pushbackCount !== 1 && row.pushbackCount !== 2) ||
      seen.has(row.questionIndex as number) ||
      !(getBankQuestionById(row.questionId as number) ??
        questions.find((question) => question.id === row.questionId))
    ) return null;
    seen.add(row.questionIndex as number);
    answers.push({
      questionIndex: row.questionIndex as number,
      questionId: row.questionId as number,
      status: row.status as SessionAnswer["status"],
      transcript: row.status === "answered" ? row.transcript as string : "",
      pushbackCount: row.status === "answered" ? row.pushbackCount as 0 | 1 | 2 : 0,
      isFollowUp: Boolean(getBankQuestionById(row.questionId as number)?.isFollowUp),
    });
  }
  return answers;
}

export const POST = withApiGuard(async (request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = typeof body === "object" && body !== null
    ? body as Record<string, unknown>
    : {};
  const attemptToken = payload.attemptToken;
  let participantId: string | null = null;
  let attemptId: string | null = null;
  const admin = typeof attemptToken === "string" ? createStudyAdminClient() : null;
  if (typeof attemptToken === "string") {
    const supabase = await createStudyServerClient();
    const user = supabase && (await supabase.auth.getUser()).data.user;
    const jar = await cookies();
    if (!user || !admin || !(await hasVisitConsent(
      user.id,
      jar.get(VISIT_ID_COOKIE)?.value,
      jar.get(VISIT_CONSENT_COOKIE)?.value,
    ))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    attemptId = await readStudyAttemptToken(user.id, attemptToken);
    if (!attemptId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const participant = await admin.from("participants")
      .select("participant_id").eq("id", user.id).maybeSingle();
    participantId = participant.data?.participant_id ?? null;
    if (!participantId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const existing = await admin.from("study_sessions")
      .select("participant_id, report").eq("attempt_id", attemptId).maybeSingle();
    if (existing.error) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if (existing.data) {
      if (existing.data.participant_id !== participantId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ report: existing.data.report, studySave: "saved" });
    }
  }

  const sessionAnswers = attemptId ? parseSessionAnswers(payload.answers) : null;
  const answers = attemptId
    ? sessionAnswers && parseAnswers(sessionAnswers
      .filter((answer) => answer.status === "answered")
      .map((answer) => {
        const question = getBankQuestionById(answer.questionId) ??
          questions.find((item) => item.id === answer.questionId)!;
        return {
          questionIndex: answer.questionIndex,
          questionId: answer.questionId,
          topic: getBankQuestionById(answer.questionId)?.topic ?? null,
          questionJapanese: question.japanese,
          transcript: answer.transcript,
          pushbackCount: answer.pushbackCount,
        };
      }))
    : parseAnswers(payload.answers);
  if (!answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }

  const report = await gradeInterview({
    primary: () =>
      runGroqGrade({
        answers,
        groqFetch: fetch,
        getGradeKey: getGroqGradeKey,
      }),
    secondary: () =>
      runDeepseekGrade({
        answers,
        deepseekFetch: fetch,
        getGradeKey: getDeepseekGradeKey,
      }),
  });

  if (!attemptId || !participantId || !report) return NextResponse.json({ report });
  let saved = false;
  try {
    const { error } = await admin!.from("study_sessions").insert({
      attempt_id: attemptId,
      participant_id: participantId,
      report,
      total: report.total,
      source: report.source,
      answers: sessionAnswers,
      scores: report.scores,
      pushback_count: sessionAnswers!.reduce(
        (sum, answer) => sum + (answer.status === "answered" ? answer.pushbackCount : 0), 0,
      ),
      follow_up_count: sessionAnswers!.filter((answer) => answer.isFollowUp).length,
    });
    saved = !error;
  } catch {
    // The report remains visible so the participant can retry the save.
  }
  return NextResponse.json({ report, studySave: saved ? "saved" : "retry" });
}, "expensive");
