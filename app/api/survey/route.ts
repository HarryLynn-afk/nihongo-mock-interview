import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getResearchFormUrl } from "@/lib/server/env/researchForm";
import { withApiGuard } from "@/lib/server/security/guard";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { readStudyAttemptToken } from "@/lib/server/study/scoreAttempt";
import {
  hasVisitConsent,
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";
import {
  MAX_SURVEY_TEXT_LENGTH,
  OPEN_ENDED_KEYS,
  RATING_KEYS,
  type SurveyOpenEnded,
  type SurveyPayload,
  type SurveyRatings,
} from "@/lib/content/survey";
import { postSurvey } from "./postSurvey";

function parseSurvey(value: unknown): SurveyPayload | null {
  if (!value || typeof value !== "object") return null;
  const survey = value as Record<string, unknown>;
  if (survey.skipped === true) return { skipped: true };
  if (
    survey.skipped !== false ||
    !survey.ratings || typeof survey.ratings !== "object" ||
    !survey.openEnded || typeof survey.openEnded !== "object"
  ) return null;
  const ratings = survey.ratings as Record<string, unknown>;
  const openEnded = survey.openEnded as Record<string, unknown>;
  if (
    !RATING_KEYS.every((key) => Number.isInteger(ratings[key]) &&
      (ratings[key] as number) >= 1 && (ratings[key] as number) <= 5) ||
    !OPEN_ENDED_KEYS.every((key) => typeof openEnded[key] === "string" &&
      (openEnded[key] as string).length <= MAX_SURVEY_TEXT_LENGTH)
  ) return null;
  return {
    skipped: false,
    ratings: ratings as SurveyRatings,
    openEnded: openEnded as SurveyOpenEnded,
  };
}

export function GET() {
  return NextResponse.json({ enabled: Boolean(getResearchFormUrl()) });
}

export const POST = withApiGuard(async (request) => {
  const url = getResearchFormUrl();
  if (!url) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createStudyServerClient();
  const user = supabase && (await supabase.auth.getUser()).data.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const input = typeof body === "object" && body !== null
    ? body as Record<string, unknown>
    : {};
  const attemptId = typeof input.attemptToken === "string"
    ? await readStudyAttemptToken(user.id, input.attemptToken)
    : null;
  if (!attemptId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  if (!(await hasVisitConsent(
    user.id,
    jar.get(VISIT_ID_COOKIE)?.value,
    jar.get(VISIT_CONSENT_COOKIE)?.value,
  ))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createStudyAdminClient();
  if (!admin) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const participant = await admin.from("participants")
    .select("participant_id").eq("id", user.id).maybeSingle();
  if (!participant.data?.participant_id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const saved = await admin.from("study_sessions")
    .select("participant_id").eq("attempt_id", attemptId).maybeSingle();
  if (saved.error) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!saved.data) return NextResponse.json({ error: "not saved" }, { status: 409 });
  if (saved.data.participant_id !== participant.data.participant_id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const survey = parseSurvey(input.survey);
  if (!survey) return NextResponse.json({ error: "Invalid survey" }, { status: 400 });

  try {
    await postSurvey({ url, payload: survey, fetchImpl: fetch });
    return new Response(null, { status: 202 });
  } catch {
    return NextResponse.json({ error: "delivery failed" }, { status: 502 });
  }
}, "write");
