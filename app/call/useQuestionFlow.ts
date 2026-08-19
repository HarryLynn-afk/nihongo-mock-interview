import { useCallback, useState } from "react";
import { questions } from "@/lib/content/questions";
import type { InterviewQuestion } from "@/lib/content/questions";

export type QuestionPhase = "senseiSpeaking" | "studentAnswering" | "done";

export type AnswerSubmission =
  | { inputMode: "typed"; transcript: string }
  | { inputMode: "voice"; transcript: string; audioClip: Blob };

export type StoredAnswer = AnswerSubmission & { questionIndex: number };

/**
 * Sequential Q1 → Q2 → Q3 → done state machine, including the sensei/student
 * turn inside each Question. No I/O — audio playback and answer capture live
 * elsewhere and report in via endSenseiTurn() and submitAnswer().
 */
export function useQuestionFlow() {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<"sensei" | "student">("sensei");
  const [answers, setAnswers] = useState<StoredAnswer[]>([]);

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

  const submitAnswer = useCallback(
    (submission: AnswerSubmission) => {
      if (phase !== "studentAnswering") return;
      setAnswers((current) => [
        ...current,
        { ...submission, questionIndex: index },
      ]);
      setIndex((current) => Math.min(current + 1, questions.length));
      setTurn("sensei");
    },
    [phase, index],
  );

  return {
    phase,
    currentQuestion,
    questionIndex: isDone ? null : index,
    answers,
    endSenseiTurn,
    submitAnswer,
  };
}
