import { questions } from "@/lib/content/questions";
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

export function buildSidebarView({
  phase,
  answers,
}: {
  phase: QuestionPhase;
  answers: readonly { questionIndex: number; transcript: string }[];
}): SidebarView {
  const completed = answers.length;
  const entries: SidebarEntry[] = [];

  for (let index = 0; index < completed; index += 1) {
    entries.push({ speaker: "sensei", text: questions[index].japanese });
    const answer = answers.find((item) => item.questionIndex === index);
    if (answer) {
      entries.push({ speaker: "student", text: answer.transcript });
    }
  }

  if (phase !== "done") {
    entries.push({
      speaker: "sensei",
      text: questions[completed].japanese,
    });
  }

  return {
    questionNumber:
      phase === "done" ? questions.length : completed + 1,
    questionCount: questions.length,
    status: phase,
    entries,
  };
}
