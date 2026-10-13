import {
  OPEN_ENDED_KEYS,
  RATING_KEYS,
  type OpenEndedKey,
  type RatingKey,
  type SurveyPayload,
} from "@/lib/content/survey";

/**
 * Google Form entry ids for the NihonGo Research Questionnaire, read from the
 * live form and kept in questionnaire order. Re-read the form if questions
 * are added, removed, or reordered, since each new question gets a new id.
 */
export const RESEARCH_FORM_FIELDS: Record<RatingKey | OpenEndedKey, string> = {
  improveUnderstanding: "entry.56970328",
  identifyWeaknesses: "entry.1117609917",
  rewriteUseful: "entry.1584949759",
  useAgain: "entry.580383874",
  easyToUse: "entry.2078568494",
  clearSteps: "entry.1587213975",
  reportClear: "entry.649058710",
  completeEasily: "entry.1140789477",
  transcriptAccurate: "entry.535422587",
  feedbackConsistent: "entry.793287150",
  mostHelpful: "entry.740580120",
  unclear: "entry.589615942",
  improvement: "entry.1855296635",
};

/** Bound the forwarding request so a stalled Google Form cannot trap the survey. */
export const SURVEY_FORWARD_TIMEOUT_MS = 10_000;

export async function postSurvey({
  url,
  payload,
  fetchImpl,
  timeoutMs = SURVEY_FORWARD_TIMEOUT_MS,
}: {
  url: string;
  payload: SurveyPayload;
  fetchImpl: typeof fetch;
  timeoutMs?: number;
}): Promise<void> {
  const body = new URLSearchParams();
  if (!payload.skipped) {
    for (const key of RATING_KEYS) {
      body.set(RESEARCH_FORM_FIELDS[key], String(payload.ratings[key]));
    }
    for (const key of OPEN_ENDED_KEYS) {
      body.set(RESEARCH_FORM_FIELDS[key], payload.openEnded[key]);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Survey delivery failed");
  } finally {
    clearTimeout(timeout);
  }
}
