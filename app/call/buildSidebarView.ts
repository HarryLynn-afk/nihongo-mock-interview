import { questions } from "@/lib/content/questions";
import type { InterviewQuestion } from "@/lib/content/questions";
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

const NO_ANSWER_SIDEBAR_TEXT = "(No answer captured)";

export function buildSidebarView({
  phase,
  answers,
  sessionQuestions = questions,
}: {
  phase: QuestionPhase;
  answers: readonly SidebarAnswer[];
  sessionQuestions?: readonly InterviewQuestion[];
}): SidebarView {
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
            : NO_ANSWER_SIDEBAR_TEXT,
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
