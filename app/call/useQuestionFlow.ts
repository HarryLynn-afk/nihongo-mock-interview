import { useCallback, useEffect, useRef, useState } from "react";
import { questions } from "@/lib/content/questions";
import type { InterviewQuestion } from "@/lib/content/questions";
import {
  followUpForTopic,
  getBankQuestionById,
  type BankQuestion,
} from "@/lib/content/questionBank";
import {
  isSubstantialRepeat,
  shouldOfferFollowUp,
} from "@/lib/content/followUpCheck";

export type QuestionPhase = "senseiSpeaking" | "studentAnswering" | "done";

export type AnswerSubmission =
  | {
      status: "answered";
      transcript: string;
      pushbackCount: 0 | 1 | 2;
    }
  | {
      status: "skipped";
    };

export type StoredAnswer = AnswerSubmission & {
  questionIndex: number;
  questionId?: number;
  isFollowUp?: boolean;
};

/**
 * Sequential Question state machine. Pitch / tests omit args and use the
 * 3 locked Questions. Practice passes a picked bank list after mount.
 */
export function useQuestionFlow(
  sessionQuestions?: readonly InterviewQuestion[] | null,
  options: { enableFollowUps?: boolean } = {},
) {
  const { enableFollowUps = false } = options;
  const [items, setItems] = useState<InterviewQuestion[] | null>(() =>
    sessionQuestions === undefined
      ? [...questions]
      : sessionQuestions && sessionQuestions.length > 0
        ? [...sessionQuestions]
        : null,
  );
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<"sensei" | "student">("sensei");
  const [answers, setAnswers] = useState<StoredAnswer[]>([]);
  const followUpsUsedRef = useRef(0);
  const storedQuestionIdsRef = useRef(new Set<number>());
  const [prevSessionQuestions, setPrevSessionQuestions] = useState(
    sessionQuestions,
  );

  if (sessionQuestions !== prevSessionQuestions) {
    setPrevSessionQuestions(sessionQuestions);
    if (sessionQuestions && sessionQuestions.length > 0) {
      setItems([...sessionQuestions]);
      setIndex(0);
      setTurn("sensei");
      setAnswers([]);
    }
  }

  useEffect(() => {
    if (!sessionQuestions || sessionQuestions.length === 0) return;
    followUpsUsedRef.current = 0;
    storedQuestionIdsRef.current = new Set();
  }, [sessionQuestions]);

  const waiting = items === null;
  const list = items ?? [];
  const isDone = !waiting && index >= list.length;
  const phase: QuestionPhase = waiting
    ? "senseiSpeaking"
    : isDone
      ? "done"
      : turn === "student"
        ? "studentAnswering"
        : "senseiSpeaking";
  const currentQuestion: InterviewQuestion | null =
    waiting || isDone ? null : list[index];

  const endSenseiTurn = useCallback(() => {
    setTurn((current) => (current === "sensei" ? "student" : current));
  }, []);

  const submitAnswer = useCallback(
    (submission: AnswerSubmission) => {
      if (phase !== "studentAnswering" || currentQuestion === null) return;
      if (storedQuestionIdsRef.current.has(currentQuestion.id)) return;
      storedQuestionIdsRef.current.add(currentQuestion.id);
      const questionIndex = index;
      const bank = getBankQuestionById(currentQuestion.id);
      const isFollowUp =
        currentQuestion.id >= 200 || Boolean(bank?.isFollowUp);
      setAnswers((current) => [
        ...current,
        {
          ...submission,
          questionIndex,
          questionId: currentQuestion.id,
          isFollowUp,
        },
      ]);

      if (enableFollowUps && !isFollowUp && submission.status === "answered") {
        const topic = bank?.topic ?? null;
        if (
          shouldOfferFollowUp({
            transcript: submission.transcript,
            topic,
            followUpsUsed: followUpsUsedRef.current,
          })
        ) {
          const followUp = topic ? followUpForTopic(topic) : undefined;
          if (
            followUp &&
            !isSubstantialRepeat(followUp.japanese, currentQuestion.japanese)
          ) {
            followUpsUsedRef.current += 1;
            setItems((current) => {
              if (!current) return current;
              const next = [...current];
              next.splice(questionIndex + 1, 0, followUp);
              return next;
            });
          }
        }
      }

      setIndex((current) => current + 1);
      setTurn("sensei");
    },
    [phase, index, currentQuestion, enableFollowUps],
  );

  return {
    phase,
    currentQuestion,
    questionIndex: isDone || waiting ? null : index,
    answers,
    sessionQuestions: list,
    endSenseiTurn,
    submitAnswer,
  };
}

export type { BankQuestion };
