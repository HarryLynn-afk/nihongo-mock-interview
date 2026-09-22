import type { QuestionPhase, StoredAnswer } from "./useQuestionFlow";

export type GradeAnswer = {
  questionIndex: number;
  transcript: string;
  pushbackCount: 0 | 1 | 2;
};

export type GradeCollection =
  | { status: "collecting" }
  | { status: "ready"; answers: GradeAnswer[] };

export function useGradeAnswers({
  answers,
  phase,
}: {
  answers: StoredAnswer[];
  phase: QuestionPhase;
}): GradeCollection {
  if (phase !== "done") {
    return { status: "collecting" };
  }

  return {
    status: "ready",
    answers: answers
      .filter((answer): answer is StoredAnswer & { status: "answered" } =>
        answer.status === "answered",
      )
      .map((answer) => ({
        questionIndex: answer.questionIndex,
        transcript: answer.transcript,
        pushbackCount: answer.pushbackCount,
      })),
  };
}
