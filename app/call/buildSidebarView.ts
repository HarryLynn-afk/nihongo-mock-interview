import { questions } from "@/lib/content/questions";
import type { InterviewQuestion } from "@/lib/content/questions";
import { DEFAULT_UI_LOCALE, type UiLocale } from "@/lib/content/locale";
import { uiCopy } from "@/lib/content/uiCopy";
import type { QuestionPhase } from "./useQuestionFlow";

export type SidebarEntry = {
  speaker: "sensei" | "student";
  text: string;
};

export type SidebarView = {
  questionNumber: number;
  questionCount: number;
  status: QuestionPhase;
  entries: SidebarEntry[];
};

type SidebarAnswer =
  | { questionIndex: number; status: "answered"; transcript: string }
  | { questionIndex: number; status: "skipped" };

export function buildSidebarView({
  phase,
  answers,
  sessionQuestions = questions,
  locale = DEFAULT_UI_LOCALE,
}: {
  phase: QuestionPhase;
  answers: readonly SidebarAnswer[];
  sessionQuestions?: readonly InterviewQuestion[];
  locale?: UiLocale;
}): SidebarView {
  const copy = uiCopy(locale);
  const list = sessionQuestions.length > 0 ? sessionQuestions : questions;
  const completed = answers.length;
  const entries: SidebarEntry[] = [];

  for (let index = 0; index < completed; index += 1) {
    const senseiText = list[index]?.japanese;
    if (senseiText) {
      entries.push({ speaker: "sensei", text: senseiText });
    }
    const answer = answers.find((item) => item.questionIndex === index);
    if (answer) {
      entries.push({
        speaker: "student",
        text:
          answer.status === "answered"
            ? answer.transcript
            : copy.call.noAnswerCaptured,
      });
    }
  }

  if (phase !== "done" && list[completed]) {
    entries.push({
      speaker: "sensei",
      text: list[completed].japanese,
    });
  }

  return {
    questionNumber: phase === "done" ? list.length : completed + 1,
    questionCount: list.length,
    status: phase,
    entries,
  };
}
