import {
  getSampleReport,
  type InterviewReport,
} from "@/lib/content/sampleReport";

export function selectDisplayedReport({
  isPitchMode,
  live,
}: {
  isPitchMode: boolean;
  live: InterviewReport;
}): InterviewReport {
  if (isPitchMode && live.headline !== "Ready") {
    return getSampleReport(null);
  }
  return live;
}
