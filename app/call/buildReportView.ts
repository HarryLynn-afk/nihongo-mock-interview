import type { InterviewReport } from "@/lib/content/sampleReport";
import {
  normalizePracticeTotal,
  RAW_RATING_LABEL,
  type Headline,
  type RubricCategoryKey,
} from "@/lib/content/rubric";
import { questions } from "@/lib/content/questions";
import {
  buildNextStep,
  formatQuotedCritique,
  isAffirmingCritique,
  type FormattedCritique,
} from "@/lib/content/critiqueCopy";

const TYPED_LINE =
  "This answer was typed, so pronunciation was not checked.";

const SPEAKING_GAP_LINE =
  "The life-plan story is fine — the gap is Japanese ability, not the life plan.";

const DISCLAIMER =
  "This is an AI-generated practice estimate based on this session. It is not an official Japanese language-school admission decision.";

const LISTENING_OMITTED =
  "Listening comprehension is not scored — this session has no listening task. Answer relevance is whether each answer matched the Question.";

const VOICE_NOTE =
  "Voice-feedback note: Audio quality, microphone quality, accent, and speech-recognition limitations may affect this estimate.";

const NOT_ASSESSED = "Not assessed — typed response";

const SCORE_ORDER: RubricCategoryKey[] = [
  "listening",
  "grammarPoliteness",
  "motivation",
  "studyPlan",
  "consistency",
  "speaking",
];

const SCORE_LABELS: Record<RubricCategoryKey, string> = {
  speaking: "Pronunciation & fluency",
  listening: "Answer relevance",
  grammarPoliteness: "Grammar & naturalness",
  motivation: "Motivation for studying in Japan",
  studyPlan: "Study plan specificity",
  consistency: "Consistency across answers",
};

const RADAR_LABELS: Record<RubricCategoryKey, string> = {
  speaking: "Pronunciation",
  listening: "Relevance",
  grammarPoliteness: "Grammar",
  motivation: "Motivation",
  studyPlan: "Study plan",
  consistency: "Consistency",
};

const QUESTION_NAV_LABELS = [
  "Self-introduction",
  "Motivation",
  "Study plan",
] as const;

const HEADLINE_LABEL: Record<Headline, string> = {
  Ready: "Strong",
  AlmostReady: "Good",
  KeepPracticing: "Keep practicing",
};

const STAMP_COLOR_CLASS: Record<Headline, string> = {
  Ready: "text-stamp-ready",
  AlmostReady: "text-stamp-almost-ready",
  KeepPracticing: "text-stamp-keep-practicing",
};

export type ReportScoreRow = {
  key: RubricCategoryKey;
  label: string;
  radarLabel: string;
  raw: number;
  ratingLabel: string;
  points: number;
  weight: number;
  assessed: boolean;
};

export type ReportQuestionCard = {
  questionIndex: number;
  navLabel: string;
  categoryLabel: string;
  japanese: string;
  transcript: string;
  scoreText: string;
  ratingLabel: string;
  quote: string;
  strengths: string[];
  nextHeading: string;
  improvements: string[];
  rewriteHeading: string;
  rewrite: string;
  burmese: string;
  evidence: string;
  affirming: boolean;
};

export type ReportView = {
  title: string;
  headlineLabel: string;
  stamp: InterviewReport["stamp"];
  stampColorClass: string;
  total: number;
  disclaimer: string;
  listeningNote: string;
  voiceNote: string | null;
  banner: string | null;
  scores: ReportScoreRow[];
  questions: ReportQuestionCard[];
  critiques: FormattedCritique[];
  notes: string[];
};

export type ReportAnswerInput = {
  questionIndex: number;
  inputMode: "voice" | "typed";
  transcript?: string;
};

export function buildReportView({
  report,
  answers,
}: {
  report: InterviewReport;
  answers: readonly ReportAnswerInput[];
}): ReportView {
  const hasVoice = answers.some((answer) => answer.inputMode === "voice");
  const hasTyped = answers.some((answer) => answer.inputMode === "typed");
  const notes: string[] = [];
  if (hasTyped && hasVoice) {
    notes.push(TYPED_LINE);
  }
  const speakingGated = report.gatesFired.includes("speaking");
  const planGated =
    report.gatesFired.includes("motivation") ||
    report.gatesFired.includes("studyPlan");
  if (speakingGated && !planGated && hasVoice) {
    notes.push(SPEAKING_GAP_LINE);
  }

  return {
    title: "Practice Interview Readiness",
    headlineLabel: HEADLINE_LABEL[report.headline],
    stamp: report.stamp,
    stampColorClass: STAMP_COLOR_CLASS[report.headline],
    total: normalizePracticeTotal(report.scores, hasVoice),
    disclaimer: DISCLAIMER,
    listeningNote: LISTENING_OMITTED,
    voiceNote: hasVoice ? VOICE_NOTE : null,
    banner: report.banner,
    scores: SCORE_ORDER.map((key) => {
      const row = report.scores[key];
      const assessed = key === "speaking" ? hasVoice : true;
      return {
        key,
        label: SCORE_LABELS[key],
        radarLabel: RADAR_LABELS[key],
        raw: row.raw,
        ratingLabel: RAW_RATING_LABEL[row.raw as 1 | 2 | 3 | 4 | 5],
        points: row.points,
        weight: row.weight,
        assessed,
      };
    }),
    questions: questions.map((question, index) => {
      const critique = report.critiques.find(
        (item) => item.questionIndex === index,
      );
      const answer = answers.find((item) => item.questionIndex === index);
      const formatted = critique ? formatQuotedCritique(critique) : null;
      const affirming = Boolean(formatted && isAffirmingCritique(formatted));
      const category = critique?.category;
      const scored = category ? report.scores[category] : null;
      const transcript = answer?.transcript?.trim() || "（無言）";
      const next = formatted && category && scored
        ? buildNextStep({
            affirming,
            raw: scored.raw,
            category,
            transcript,
            quote: formatted.quote,
            explanation: formatted.explanation,
            rewrite: formatted.rewrite,
          })
        : null;
      const quote = formatted?.quote ?? "";
      return {
        questionIndex: index,
        navLabel: QUESTION_NAV_LABELS[index] ?? `Question ${index + 1}`,
        categoryLabel: category
          ? SCORE_LABELS[category]
          : (QUESTION_NAV_LABELS[index] ?? `Question ${index + 1}`),
        japanese: question.japanese,
        transcript,
        scoreText: scored ? `${scored.points}/${scored.weight}` : "—",
        ratingLabel: scored
          ? RAW_RATING_LABEL[scored.raw as 1 | 2 | 3 | 4 | 5]
          : "",
        quote,
        strengths: formatted
          ? affirming
            ? [formatted.explanation]
            : quote && quote !== "（無言）"
              ? [`Your answer includes 「${quote}」.`]
              : []
          : [],
        nextHeading: next?.heading ?? "Improve next",
        improvements: next?.lines ?? [],
        rewriteHeading: next?.rewriteHeading ?? "Suggested improved Japanese answer",
        rewrite: next?.rewrite ?? "",
        burmese: formatted?.burmese ?? "",
        evidence: formatted ? formatted.explanation : "",
        affirming,
      };
    }),
    critiques: report.critiques.map(formatQuotedCritique),
    notes,
  };
}

export const REPORT_NOT_ASSESSED = NOT_ASSESSED;
