import type { InterviewReport } from "@/lib/content/sampleReport";
import {
  normalizePracticeTotal,
  type Headline,
  type RubricCategoryKey,
} from "@/lib/content/rubric";
import type { InterviewQuestion } from "@/lib/content/questions";
import { questions } from "@/lib/content/questions";
import { getBankQuestionById } from "@/lib/content/questionBank";
import {
  buildNextStep,
  formatQuotedCritique,
  isAffirmingCritique,
  type FormattedCritique,
} from "@/lib/content/critiqueCopy";
import { DEFAULT_UI_LOCALE, type UiLocale } from "@/lib/content/locale";
import { uiCopy } from "@/lib/content/uiCopy";

const SCORE_ORDER: Exclude<RubricCategoryKey, "speaking">[] = [
  "listening",
  "grammarPoliteness",
  "motivation",
  "studyPlan",
  "consistency",
];

const PITCH_NAV_TOPICS = [
  "selfIntroduction",
  "motivationJapan",
  "studyPlan",
] as const;

const STAMP_COLOR_CLASS: Record<Headline, string> = {
  Ready: "text-feather",
  AlmostReady: "text-bee",
  KeepPracticing: "text-red-500",
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
  evidence: string;
  affirming: boolean;
};

export type ReportView = {
  title: string;
  answerQualityTitle: string;
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

export type ReportAnswerInput =
  | { questionIndex: number; status: "answered"; transcript: string }
  | { questionIndex: number; status: "skipped" };

export function buildReportView({
  report,
  answers,
  sessionQuestions = questions,
  locale = DEFAULT_UI_LOCALE,
}: {
  report: InterviewReport;
  answers: readonly ReportAnswerInput[];
  sessionQuestions?: readonly InterviewQuestion[];
  locale?: UiLocale;
}): ReportView {
  const copy = uiCopy(locale);
  const notes: string[] = [];

  return {
    title: copy.report.title,
    answerQualityTitle: copy.report.answerQualityTitle,
    headlineLabel: copy.report.headline[report.headline],
    stamp: report.stamp,
    stampColorClass: STAMP_COLOR_CLASS[report.headline],
    total: normalizePracticeTotal(report.scores, false),
    disclaimer: copy.report.disclaimer,
    listeningNote: copy.report.listeningNote,
    voiceNote: null,
    banner: report.banner,
    scores: SCORE_ORDER.map((key) => {
      const row = report.scores[key];
      const raw = row.raw as 1 | 2 | 3 | 4 | 5;
      return {
        key,
        label: copy.report.scores[key],
        radarLabel: copy.report.radar[key],
        raw: row.raw,
        ratingLabel: copy.report.rating[raw],
        points: row.points,
        weight: row.weight,
        assessed: true,
      };
    }),
    questions: sessionQuestions.map((question, index) => {
      const answer = answers.find((item) => item.questionIndex === index);
      const bank = getBankQuestionById(question.id);
      const navLabel = bank
        ? copy.report.topics[bank.topic]
        : copy.report.topics[PITCH_NAV_TOPICS[index] ?? "selfIntroduction"];

      if (!answer || answer.status === "skipped") {
        return {
          questionIndex: index,
          navLabel,
          japanese: question.japanese,
          transcript: copy.report.noAnswerTranscript,
          scoreText: "—",
          ratingLabel: "",
          quote: "",
          strengths: [],
          nextHeading: copy.report.noAnswerNextHeading,
          improvements: [copy.report.noAnswerNextStep],
          rewriteHeading: copy.report.rewriteHeading,
          rewrite: "",
          evidence: "",
          affirming: false,
        };
      }

      const critique = report.critiques.find(
        (item) => item.questionIndex === index,
      );
      const formatted = critique ? formatQuotedCritique(critique, locale) : null;
      const affirming = Boolean(formatted && isAffirmingCritique(formatted));
      const category = critique?.category;
      const scored = category ? report.scores[category] : null;
      const transcript = answer.transcript.trim() || "（無言）";
      const next =
        formatted && category && scored
          ? buildNextStep({
              affirming,
              raw: scored.raw,
              category,
              transcript,
              quote: formatted.quote,
              explanation: formatted.explanation,
              rewrite: formatted.rewrite,
              locale,
            })
          : null;
      const showScore = Boolean(category && category !== "speaking" && scored);
      const quote = formatted?.quote ?? "";
      const raw = scored ? (scored.raw as 1 | 2 | 3 | 4 | 5) : null;
      return {
        questionIndex: index,
        navLabel,
        japanese: question.japanese,
        transcript,
        scoreText: showScore && scored ? `${scored.points}/${scored.weight}` : "—",
        ratingLabel: showScore && scored && raw ? copy.report.rating[raw] : "",
        quote,
        strengths: formatted
          ? affirming
            ? [formatted.explanation]
            : quote && quote !== "（無言）"
              ? [
                  copy.report.answerIncludesQuote.replace("{quote}", quote),
                ]
              : []
          : [],
        nextHeading: next?.heading ?? copy.report.improveNext,
        improvements: next?.lines ?? [],
        rewriteHeading: next?.rewriteHeading ?? copy.report.rewriteHeading,
        rewrite: next?.rewrite ?? "",
        evidence: formatted ? formatted.explanation : "",
        affirming,
      };
    }),
    critiques: report.critiques.map((critique) =>
      formatQuotedCritique(critique, locale),
    ),
    notes,
  };
}
