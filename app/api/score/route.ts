import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBankQuestionById } from "@/lib/content/questionBank";
import { questions, LOCKED_QUESTION_TOPICS } from "@/lib/content/questions";
import { getDeepseekGradeKey } from "@/lib/server/env/deepseekGrade";
import { getGroqGradeKey } from "@/lib/server/env/groqGrade";
import { withApiGuard } from "@/lib/server/security/guard";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudySaveReceipt, readStudyAttemptToken, type StudySessionAnswer } from "@/lib/server/study/scoreAttempt";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { readSavedSessionReport } from "@/lib/server/study/readSavedSessionReport";
import { saveSessionReport } from "@/lib/server/study/saveSessionReport";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "@/lib/server/study/visitConsent";
import { gradeInterview } from "../grade/gradeInterview";
import { parseAnswers } from "../grade/parseAnswers";
import { runDeepseekGrade } from "../grade/runDeepseekGrade";
import { runGroqGrade } from "../grade/runGroqGrade";

/** Groq/DeepSeek grade can be slow; keep the route alive for in-process calls. */
export const maxDuration = 60;

function parseSessionAnswers(value: unknown): StudySessionAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 13) return null;
  const seenQuestionIds = new Set<number>();
  const answers: StudySessionAnswer[] = [];
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
      row.questionIndex !== answers.length ||
      seenQuestionIds.has(row.questionId as number) ||
      !(getBankQuestionById(row.questionId as number) ??
        questions.find((question) => question.id === row.questionId))
    ) return null;
    seenQuestionIds.add(row.questionId as number);
    answers.push({
      questionIndex: row.questionIndex as number,
      questionId: row.questionId as number,
      status: row.status as StudySessionAnswer["status"],
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
  let userId: string | null = null;
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
    userId = user.id;
    attemptId = await readStudyAttemptToken(user.id, attemptToken);
    if (!attemptId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const participant = await admin.from("participants")
      .select("participant_id").eq("id", user.id).maybeSingle();
    participantId = participant.data?.participant_id ?? null;
    if (!participantId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const existing = await readSavedSessionReport({ admin, attemptId, participantId });
    if (existing.state === "unavailable") {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    if (existing.state === "other-participant") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (existing.state === "saved") {
      return NextResponse.json({ report: existing.report, studySave: "saved" });
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
          topic: getBankQuestionById(answer.questionId)?.topic ?? LOCKED_QUESTION_TOPICS[answer.questionId] ?? null,
          questionJapanese: question.japanese,
          transcript: answer.transcript,
          pushbackCount: answer.pushbackCount,
        };
      }))
    : parseAnswers(payload.answers);
  if (!answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }
  if (!attemptId && answers.some((answer) =>
    !Number.isInteger(answer.questionIndex) ||
    questions[answer.questionIndex]?.id !== answer.questionId)) {
    return NextResponse.json({ error: "Invalid guest question" }, { status: 400 });
  }
  if (!attemptId) {
    for (const answer of answers) {
      answer.questionJapanese = questions[answer.questionIndex].japanese;
      answer.topic = LOCKED_QUESTION_TOPICS[answer.questionId];
    }
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
  const saved = await saveSessionReport({
    admin: admin!, attemptId, participantId, report, answers: sessionAnswers!,
  });
  if (saved === "conflict") {
    // Another request won the save race; never return a conflicting report.
    // shortcut: the loser already graded, so overlapping requests still spend
    // two provider calls; claim the attempt atomically if that matters.
    const winner = await readSavedSessionReport({ admin: admin!, attemptId, participantId });
    if (winner.state === "other-participant") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (winner.state !== "saved") {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json({ report: winner.report, studySave: "saved" });
  }
  if (saved === "failed") {
    const saveReceipt = await createStudySaveReceipt({
      userId: userId!,
      attemptId,
      report,
      answers: sessionAnswers!,
    });
    return NextResponse.json({ report, studySave: "retry", ...(saveReceipt ? { saveReceipt } : {}) });
  }
  return NextResponse.json({ report, studySave: "saved" });
}, "expensive");
