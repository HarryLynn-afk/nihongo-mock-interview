import type { InterviewReport } from "@/lib/content/sampleReport";
import {
  normalizePracticeTotal,
  RAW_RATING_LABEL,
  type Headline,
  type RubricCategoryKey,
} from "@/lib/content/rubric";
import type { InterviewQuestion } from "@/lib/content/questions";
import { questions } from "@/lib/content/questions";
import { getBankQuestionById, TOPIC_NAV_LABEL } from "@/lib/content/questionBank";
import {
  buildNextStep,
  formatQuotedCritique,
  isAffirmingCritique,
  type FormattedCritique,
} from "@/lib/content/critiqueCopy";
import {
  ANSWER_QUALITY_NOTE,
  ANSWER_QUALITY_TITLE,
  DELIVERY_SECTION_TITLE,
  type SessionDelivery,
} from "@/lib/content/deliverySignals";

const DISCLAIMER =
  "NihonGo provides AI-assisted mock interview practice. It evaluates interview-answer quality from the confirmed transcript. It is not an official language-proficiency score or admission decision.";

const LISTENING_OMITTED =
  "Listening comprehension is not scored — this session has no listening task. Answer relevance is whether each answer matched the Question.";

const NOT_ASSESSED = "Not assessed";

const SCORE_ORDER: RubricCategoryKey[] = [
  "listening",
  "grammarPoliteness",
  "motivation",
  "studyPlan",
  "consistency",
];

const SCORE_LABELS: Record<RubricCategoryKey, string> = {
  speaking: "Answer wording",
  listening: "Answer relevance",
  grammarPoliteness: "Grammar & naturalness",
  motivation: "Motivation for studying in Japan",
  studyPlan: "Study plan specificity",
  consistency: "Consistency across answers",
};

const RADAR_LABELS: Record<RubricCategoryKey, string> = {
  speaking: "Wording",
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
  answerQualityTitle: string;
  answerQualityNote: string;
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
  delivery: SessionDelivery | null;
  deliveryTitle: string;
};

export type ReportAnswerInput = {
  questionIndex: number;
  inputMode: "voice" | "typed";
  transcript?: string;
};

export function buildReportView({
  report,
  answers,
  sessionQuestions = questions,
  delivery = null,
}: {
  report: InterviewReport;
  answers: readonly ReportAnswerInput[];
  sessionQuestions?: readonly InterviewQuestion[];
  delivery?: SessionDelivery | null;
}): ReportView {
  const hasVoice = answers.some((answer) => answer.inputMode === "voice");
  const notes: string[] = [];

  return {
    title: "AI Interview Practice Feedback",
    answerQualityTitle: ANSWER_QUALITY_TITLE,
    answerQualityNote: ANSWER_QUALITY_NOTE,
    headlineLabel: HEADLINE_LABEL[report.headline],
    stamp: report.stamp,
    stampColorClass: STAMP_COLOR_CLASS[report.headline],
    total: normalizePracticeTotal(report.scores, false),
    disclaimer: DISCLAIMER,
    listeningNote: LISTENING_OMITTED,
    voiceNote: null,
    banner: report.banner,
    scores: SCORE_ORDER.map((key) => {
      const row = report.scores[key];
      return {
        key,
        label: SCORE_LABELS[key],
        radarLabel: RADAR_LABELS[key],
        raw: row.raw,
        ratingLabel: RAW_RATING_LABEL[row.raw as 1 | 2 | 3 | 4 | 5],
        points: row.points,
        weight: row.weight,
        assessed: true,
      };
    }),
    delivery: hasVoice ? delivery : null,
    deliveryTitle: DELIVERY_SECTION_TITLE,
    questions: sessionQuestions.map((question, index) => {
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
      const showScore = Boolean(category && category !== "speaking" && scored);
      const quote = formatted?.quote ?? "";
      const bank = getBankQuestionById(question.id);
      const navLabel =
        (bank ? TOPIC_NAV_LABEL[bank.topic] : QUESTION_NAV_LABELS[index]) ??
        `Question ${index + 1}`;
      return {
        questionIndex: index,
        navLabel,
        categoryLabel: category ? SCORE_LABELS[category] : navLabel,
        japanese: question.japanese,
        transcript,
        scoreText: showScore && scored ? `${scored.points}/${scored.weight}` : "—",
        ratingLabel: showScore && scored
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
