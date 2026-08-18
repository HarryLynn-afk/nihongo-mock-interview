import { useCallback, useState } from "react";
import { questions } from "@/lib/content/questions";
import type { InterviewQuestion } from "@/lib/content/questions";

export type QuestionPhase = "senseiSpeaking" | "studentAnswering" | "done";

/**
 * Sequential Q1 → Q2 → Q3 → done state machine, including the sensei/student
 * turn inside each Question. No I/O — audio playback and answer capture live
 * elsewhere and report in via endSenseiTurn() and submitAnswer().
 */
export function useQuestionFlow() {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<"sensei" | "student">("sensei");

  const isDone = index >= questions.length;
  const phase: QuestionPhase = isDone
    ? "done"
    : turn === "student"
      ? "studentAnswering"
      : "senseiSpeaking";
  const currentQuestion: InterviewQuestion | null = isDone
    ? null
    : questions[index];

  const endSenseiTurn = useCallback(() => {
    setTurn((current) => (current === "sensei" ? "student" : current));
  }, []);

  const submitAnswer = useCallback(() => {
    if (phase !== "studentAnswering") return;
    setIndex((current) => Math.min(current + 1, questions.length));
    setTurn("sensei");
  }, [phase]);

  return { phase, currentQuestion, endSenseiTurn, submitAnswer };
}
