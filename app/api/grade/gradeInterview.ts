import {
  getSampleReport,
  SCORING_UNAVAILABLE_BANNER,
} from "@/lib/content/sampleReport";
import type { InterviewReport } from "./runGroqGrade";

export async function gradeInterview({
  fallback,
}: {
  fallback: () => Promise<InterviewReport | null>;
}): Promise<InterviewReport> {
  return (await fallback()) ?? getSampleReport(SCORING_UNAVAILABLE_BANNER);
}
