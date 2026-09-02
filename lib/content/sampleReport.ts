import type { ScoredReport } from "./rubric";
import type { QuotedCritique } from "./parseQuotedCritiques";
import sample from "@/mocks/sample-report-ready.json";

export const SCORING_UNAVAILABLE_BANNER =
  "Scoring unavailable — sample report." as const;

export type InterviewReport = ScoredReport & {
  critiques: QuotedCritique[];
  profileName: string;
  source: "n8n" | "grade" | "sample";
  banner: string | null;
};

export function getSampleReport(
  banner: typeof SCORING_UNAVAILABLE_BANNER | null,
): InterviewReport {
  return {
    headline: sample.headline,
    stamp: sample.stamp,
    total: sample.total,
    scores: sample.scores,
    gatesFired: sample.gatesFired,
    critiques: sample.critiques as InterviewReport["critiques"],
    profileName: sample.profileName,
    source: "sample",
    banner,
  } as InterviewReport;
}
