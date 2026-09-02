import { SURVEY_COPY } from "./surveyCopy";
import type { InterviewReport } from "./sampleReport";

export type UsefulnessView = {
  sessionId: string;
  copy: typeof SURVEY_COPY;
};

export type SurveyAnswer = {
  questionIndex: number;
  pushbackCount: 0 | 1 | 2;
  forced: boolean;
};

export type SurveyRating = 1 | 2 | 3 | 4 | 5;

export type SurveyPayload = {
  sessionId: string;
  headline: InterviewReport["headline"];
  total: number;
  source: "live" | "sample";
  answers: SurveyAnswer[];
} & (
  | { skipped: true }
  | {
      skipped: false;
      usefulness: SurveyRating;
      usability: SurveyRating;
      comment: string | null;
    }
);

export function buildUsefulnessView({
  isPitchMode,
  formEnabled,
  revealDone,
  sessionId,
}: {
  isPitchMode: boolean;
  formEnabled: boolean;
  revealDone: boolean;
  sessionId: string;
}): UsefulnessView | null {
  if (isPitchMode || !formEnabled || !revealDone) return null;
  return { sessionId, copy: SURVEY_COPY };
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function buildSurveyPayload({
  report,
  answers,
  sessionId,
  outcome,
}: {
  report: InterviewReport;
  answers: readonly SurveyAnswer[];
  sessionId: string;
  outcome:
    | { skipped: true }
    | {
        skipped: false;
        usefulness: SurveyRating;
        usability: SurveyRating;
        comment: string;
      };
}): SurveyPayload {
  const base = {
    sessionId,
    headline: report.headline,
    total: report.total,
    source: report.source === "sample" ? "sample" : "live",
    answers: [...answers],
  };
  if (outcome.skipped) {
    return { ...base, skipped: true };
  }
  return {
    ...base,
    skipped: false,
    usefulness: outcome.usefulness,
    usability: outcome.usability,
    comment: outcome.comment.trim() || null,
  };
}
