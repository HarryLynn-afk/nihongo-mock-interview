import { SURVEY_COPY } from "./surveyCopy";

export type UsefulnessView = {
  copy: typeof SURVEY_COPY;
};

/** Rating keys, in the order the Google Form lists them. */
export const RATING_KEYS = [
  "improveUnderstanding",
  "identifyWeaknesses",
  "rewriteUseful",
  "useAgain",
  "easyToUse",
  "clearSteps",
  "reportClear",
  "completeEasily",
  "transcriptAccurate",
  "feedbackConsistent",
] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

export const OPEN_ENDED_KEYS = ["mostHelpful", "unclear", "improvement"] as const;
export type OpenEndedKey = (typeof OPEN_ENDED_KEYS)[number];
export const MAX_SURVEY_TEXT_LENGTH = 1000;

export type SurveyRating = 1 | 2 | 3 | 4 | 5;
export type SurveyRatings = Record<RatingKey, SurveyRating>;
export type SurveyOpenEnded = Record<OpenEndedKey, string>;

/**
 * What leaves the browser for the research form. No session id, report
 * result, or pushback metadata — the form has questions only for the
 * questionnaire itself, so nothing else can be recorded.
 */
export type SurveyPayload =
  | { skipped: true }
  | { skipped: false; ratings: SurveyRatings; openEnded: SurveyOpenEnded };

export function buildUsefulnessView({
  formEnabled,
}: {
  formEnabled: boolean;
}): UsefulnessView | null {
  if (!formEnabled) return null;
  return { copy: SURVEY_COPY };
}

export type SessionRespondent = "guest" | "participant";

const SESSION_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSessionCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => SESSION_CODE_CHARS[byte % SESSION_CODE_CHARS.length],
  ).join("");
}

export function createSessionId(respondent: SessionRespondent): string {
  const prefix = respondent === "participant" ? "P" : "G";
  return `${prefix}-${randomSessionCode()}`;
}
