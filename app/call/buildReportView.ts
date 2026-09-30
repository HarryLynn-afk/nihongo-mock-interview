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
import { uiCopy, type UiCopy } from "@/lib/content/uiCopy";

const SCORE_ORDER: RubricCategoryKey[] = [
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

function scoreLabel(copy: UiCopy, key: RubricCategoryKey): string {
  if (key === "speaking") return "Answer wording";
  return copy.report.scores[key];
}

function radarLabel(copy: UiCopy, key: RubricCategoryKey): string {
  if (key === "speaking") return "Wording";
  return copy.report.radar[key];
}

function localizeNextHeading(heading: string, copy: UiCopy): string {
  if (heading === "Improve next") return copy.report.improveNext;
  if (heading === "Optional enhancement") return copy.report.optionalEnhancement;
  if (heading === "Make it even stronger") return copy.report.makeStronger;
  return heading;
}

function localizeRewriteHeading(heading: string, copy: UiCopy): string {
  if (heading === "Suggested improved Japanese answer") {
    return copy.report.rewriteHeading;
  }
  if (heading === "Useful phrase to keep") return copy.report.usefulPhrase;
  return heading;
}

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
        label: scoreLabel(copy, key),
        radarLabel: radarLabel(copy, key),
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
          categoryLabel: navLabel,
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
          burmese: "",
          evidence: "",
          affirming: false,
        };
      }

      const critique = report.critiques.find(
        (item) => item.questionIndex === index,
      );
      const formatted = critique ? formatQuotedCritique(critique) : null;
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
            })
          : null;
      const showScore = Boolean(category && category !== "speaking" && scored);
      const quote = formatted?.quote ?? "";
      const raw = scored ? (scored.raw as 1 | 2 | 3 | 4 | 5) : null;
      return {
        questionIndex: index,
        navLabel,
        categoryLabel: category ? scoreLabel(copy, category) : navLabel,
        japanese: question.japanese,
        transcript,
        scoreText: showScore && scored ? `${scored.points}/${scored.weight}` : "—",
        ratingLabel: showScore && scored && raw ? copy.report.rating[raw] : "",
        quote,
        strengths: formatted
          ? affirming
            ? [formatted.explanation]
            : quote && quote !== "（無言）"
              ? [`Your answer includes 「${quote}」.`]
              : []
          : [],
        nextHeading: localizeNextHeading(
          next?.heading ?? "Improve next",
          copy,
        ),
        improvements: next?.lines ?? [],
        rewriteHeading: localizeRewriteHeading(
          next?.rewriteHeading ?? "Suggested improved Japanese answer",
          copy,
        ),
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

export const REPORT_NOT_ASSESSED = "Not assessed";
