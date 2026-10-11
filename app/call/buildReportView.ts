import type { InterviewReport } from "@/lib/content/sampleReport";
import {
  RUBRIC_CATEGORY_KEYS,
  type RubricCategoryKey,
} from "@/lib/content/rubric";
import type { InterviewQuestion } from "@/lib/content/questions";
import { questions } from "@/lib/content/questions";
import { getBankQuestionById } from "@/lib/content/questionBank";
import {
  buildNextStep,
  formatQuotedCritique,
  isAffirmingCritique,
} from "@/lib/content/critiqueCopy";
import { DEFAULT_UI_LOCALE, type UiLocale } from "@/lib/content/locale";
import { uiCopy } from "@/lib/content/uiCopy";

const PITCH_NAV_TOPICS = [
  "selfIntroduction",
  "motivationJapan",
  "studyPlan",
] as const;

export type ReportScoreRow = {
  key: RubricCategoryKey;
  label: string;
  radarLabel: string;
  level: 1 | 2 | 3 | 4;
  levelLabel: string;
};

export type ReportQuestionCard = {
  questionIndex: number;
  navLabel: string;
  japanese: string;
  transcript: string;
  quote: string;
  evidence: string;
  improvement: string;
  improvementHeading: string;
  rewriteHeading: string;
  rewrite: string;
  categoryLabel: string;
  ratingLabel: string;
  affirming: boolean;
};

export type ReportView = {
  title: string;
  answerQualityTitle: string;
  progressLabel: string;
  total: number;
  disclaimer: string;
  banner: string | null;
  scores: ReportScoreRow[];
  questions: ReportQuestionCard[];
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

  return {
    title: copy.report.title,
    answerQualityTitle: copy.report.answerQualityTitle,
    progressLabel: copy.report.practiceProgress,
    total: report.total,
    disclaimer: copy.report.disclaimer,
    banner: report.banner,
    scores: RUBRIC_CATEGORY_KEYS.map((key) => {
      const level = report.scores[key].raw as 1 | 2 | 3 | 4;
      return {
        key,
        label: copy.report.scores[key],
        radarLabel: copy.report.radar[key],
        level,
        levelLabel: copy.report.rating[level],
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
          quote: "",
          evidence: "",
          improvement: copy.report.noAnswerNextStep,
          improvementHeading: copy.report.noAnswerNextHeading,
          rewriteHeading: copy.report.rewriteHeading,
          rewrite: "",
          categoryLabel: "",
          ratingLabel: "",
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
              topic: bank?.topic ?? null,
            })
          : null;
      return {
        questionIndex: index,
        navLabel,
        japanese: question.japanese,
        transcript,
        quote: formatted?.quote ?? "",
        evidence: formatted ? formatted.explanation : "",
        improvement: next?.improvement ?? "",
        improvementHeading: next?.heading ?? copy.report.improveNext,
        rewriteHeading: next?.rewriteHeading ?? copy.report.rewriteHeading,
        rewrite: next?.rewrite ?? "",
        categoryLabel: category ? copy.report.scores[category] : "",
        ratingLabel: scored ? copy.report.rating[scored.raw as 1 | 2 | 3 | 4] : "",
        affirming,
      };
    }),
  };
}
