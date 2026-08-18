import { useState } from "react";
import { questions } from "@/lib/content/questions";
import type { InterviewQuestion } from "@/lib/content/questions";

export type QuestionPhase = "asking" | "done";

/**
 * Sequential Q1 → Q2 → Q3 → done state machine. No I/O — this hook only
 * tracks which question the interview is on. Audio playback and answer
 * capture live elsewhere and call submitAnswer() when their turn ends.
 */
export function useQuestionFlow() {
  const [index, setIndex] = useState(0);

  const isDone = index >= questions.length;
  const phase: QuestionPhase = isDone ? "done" : "asking";
  const currentQuestion: InterviewQuestion | null = isDone
    ? null
    : questions[index];

  function submitAnswer() {
    setIndex((current) => Math.min(current + 1, questions.length));
  }

  return { phase, currentQuestion, submitAnswer };
}
