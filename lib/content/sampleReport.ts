import type { ScoredReport } from "./rubric";
import type { QuotedCritique } from "./parseQuotedCritiques";
import sample from "@/mocks/sample-report.json";

export const SCORING_UNAVAILABLE_BANNER =
  "Scoring unavailable — sample report." as const;

export type InterviewReport = ScoredReport & {
  critiques: QuotedCritique[];
  profileName: string;
  source: "grade" | "sample";
  banner: string | null;
};

export function getSampleReport(
  banner: typeof SCORING_UNAVAILABLE_BANNER | null,
): InterviewReport {
  return {
    total: sample.total,
    scores: sample.scores,
    critiques: sample.critiques as InterviewReport["critiques"],
    profileName: sample.profileName,
    source: "sample",
    banner,
  } as InterviewReport;
}
