import type { InterviewReport } from "@/lib/content/sampleReport";
import type { Headline, RubricCategoryKey } from "@/lib/content/rubric";
import {
  formatQuotedCritique,
  type FormattedCritique,
} from "@/lib/content/critiqueCopy";

const TYPED_LINE =
  "This answer was typed, so pronunciation was not checked.";

const SPEAKING_GAP_LINE =
  "The life-plan story is fine — the gap is Japanese ability, not the life plan.";

const SCORE_ORDER: RubricCategoryKey[] = [
  "speaking",
  "listening",
  "grammarPoliteness",
  "motivation",
  "studyPlan",
  "consistency",
];

const SCORE_LABELS: Record<RubricCategoryKey, string> = {
  speaking: "Speaking",
  listening: "Listening",
  grammarPoliteness: "Grammar & politeness",
  motivation: "Motivation",
  studyPlan: "Study plan",
  consistency: "Consistency",
};

const STAMP_COLOR_CLASS: Record<Headline, string> = {
  Ready: "text-stamp-ready",
  AlmostReady: "text-stamp-almost-ready",
  KeepPracticing: "text-stamp-keep-practicing",
};

export type ReportView = {
  title: string;
  stamp: InterviewReport["stamp"];
  stampColorClass: string;
  total: number;
  banner: string | null;
  scores: Array<{
    key: RubricCategoryKey;
    label: string;
    raw: number;
    points: number;
  }>;
  critiques: FormattedCritique[];
  notes: string[];
};

export function buildReportView({
  report,
  answers,
}: {
  report: InterviewReport;
  answers: readonly { questionIndex: number; inputMode: "voice" | "typed" }[];
}): ReportView {
  const notes: string[] = [];
  if (answers.some((answer) => answer.inputMode === "typed")) {
    notes.push(TYPED_LINE);
  }
  const speakingGated = report.gatesFired.includes("speaking");
  const planGated =
    report.gatesFired.includes("motivation") ||
    report.gatesFired.includes("studyPlan");
  if (speakingGated && !planGated) {
    notes.push(SPEAKING_GAP_LINE);
  }

  return {
    title: "Interview Readiness",
    stamp: report.stamp,
    stampColorClass: STAMP_COLOR_CLASS[report.headline],
    total: report.total,
    banner: report.banner,
    scores: SCORE_ORDER.map((key) => ({
      key,
      label: SCORE_LABELS[key],
      raw: report.scores[key].raw,
      points: report.scores[key].points,
    })),
    critiques: report.critiques.map(formatQuotedCritique),
    notes,
  };
}
