import type { SurveyPayload } from "@/lib/content/survey";

/** Google Form entry ids for the dedicated research form (Issue 29). */
export const RESEARCH_FORM_FIELDS = {
  sessionId: "entry.1571804127",
  headline: "entry.118245774",
  total: "entry.629201507",
  source: "entry.1636094148",
  q1PushbackCount: "entry.820831902",
  q1Forced: "entry.1351365414",
  q2PushbackCount: "entry.1200746092",
  q2Forced: "entry.550204019",
  q3PushbackCount: "entry.1832827395",
  q3Forced: "entry.833059275",
  skipped: "entry.414556491",
  usefulness: "entry.56970328",
  usability: "entry.589615942",
  comment: "entry.1855296635",
} as const;

function answerField(
  payload: SurveyPayload,
  questionIndex: number,
): { pushbackCount: string; forced: string } {
  const row = payload.answers.find((answer) => answer.questionIndex === questionIndex);
  return {
    pushbackCount: String(row?.pushbackCount ?? ""),
    forced: String(row?.forced ?? ""),
  };
}

export async function postSurvey({
  url,
  payload,
  fetchImpl,
}: {
  url: string;
  payload: SurveyPayload;
  fetchImpl: typeof fetch;
}): Promise<void> {
  const q1 = answerField(payload, 0);
  const q2 = answerField(payload, 1);
  const q3 = answerField(payload, 2);
  const body = new URLSearchParams({
    [RESEARCH_FORM_FIELDS.sessionId]: payload.sessionId,
    [RESEARCH_FORM_FIELDS.headline]: payload.headline,
    [RESEARCH_FORM_FIELDS.total]: String(payload.total),
    [RESEARCH_FORM_FIELDS.source]: payload.source,
    [RESEARCH_FORM_FIELDS.q1PushbackCount]: q1.pushbackCount,
    [RESEARCH_FORM_FIELDS.q1Forced]: q1.forced,
    [RESEARCH_FORM_FIELDS.q2PushbackCount]: q2.pushbackCount,
    [RESEARCH_FORM_FIELDS.q2Forced]: q2.forced,
    [RESEARCH_FORM_FIELDS.q3PushbackCount]: q3.pushbackCount,
    [RESEARCH_FORM_FIELDS.q3Forced]: q3.forced,
    [RESEARCH_FORM_FIELDS.skipped]: String(payload.skipped),
    [RESEARCH_FORM_FIELDS.usefulness]: payload.skipped
      ? ""
      : String(payload.usefulness),
    [RESEARCH_FORM_FIELDS.usability]: payload.skipped
      ? ""
      : String(payload.usability),
    [RESEARCH_FORM_FIELDS.comment]: payload.skipped
      ? ""
      : (payload.comment ?? ""),
  });

  try {
    await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // swallow — a form miss must never blank the report
  }
}
