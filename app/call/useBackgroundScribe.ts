import { useEffect, useRef, useState } from "react";
import type { QuestionPhase, StoredAnswer } from "./useQuestionFlow";

export type AnswerForScoring = {
  questionIndex: number;
  transcript: string;
  useSubmittedTranscript: boolean;
  pushbackCount: 0 | 1 | 2;
};

export type ScribeCollection =
  | { status: "collecting" }
  | { status: "ready"; answers: AnswerForScoring[] };

type ScribeOutcome = { kind: "scribe"; text: string } | { kind: "fallback" };

export function useBackgroundScribe({
  answers,
  phase,
  finishWaitMs = 5_000,
}: {
  answers: StoredAnswer[];
  phase: QuestionPhase;
  finishWaitMs?: number;
}): ScribeCollection {
  const started = useRef(new Set<number>());
  const droppedRef = useRef(false);
  const [outcomes, setOutcomes] = useState<Record<number, ScribeOutcome>>({});
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    for (const answer of answers) {
      if (answer.status !== "answered") continue;
      if (started.current.has(answer.questionIndex)) continue;
      started.current.add(answer.questionIndex);

      if (answer.audioClip.size === 0) {
        continue;
      }

      const form = new FormData();
      form.append("audio", answer.audioClip, "answer.webm");
      void fetch("/api/scribe", { method: "POST", body: form })
        .then(async (res) => {
          if (droppedRef.current) return;
          const data = (await res.json()) as { transcript?: unknown };
          if (droppedRef.current) return;
          const text =
            typeof data.transcript === "string" ? data.transcript.trim() : "";
          setOutcomes((current) => ({
            ...current,
            [answer.questionIndex]: text
              ? { kind: "scribe", text }
              : { kind: "fallback" },
          }));
        })
        .catch(() => {
          if (droppedRef.current) return;
          setOutcomes((current) => ({
            ...current,
            [answer.questionIndex]: { kind: "fallback" },
          }));
        });
    }
  }, [answers]);

  useEffect(() => {
    if (phase !== "done") return;
    const id = setTimeout(() => {
      droppedRef.current = true;
      setDropped(true);
    }, finishWaitMs);
    return () => clearTimeout(id);
  }, [phase, finishWaitMs]);

  const answeredPending =
    !dropped &&
    answers.some(
      (answer) =>
        answer.status === "answered" &&
        answer.audioClip.size > 0 &&
        outcomes[answer.questionIndex] === undefined,
    );

  if (phase !== "done" || answeredPending) {
    return { status: "collecting" };
  }

  return {
    status: "ready",
    answers: answers
      .filter((answer): answer is StoredAnswer & { status: "answered" } =>
        answer.status === "answered",
      )
      .map((answer) => {
        const outcome = outcomes[answer.questionIndex];
        if (outcome?.kind === "scribe") {
          return {
            questionIndex: answer.questionIndex,
            transcript: outcome.text,
            useSubmittedTranscript: false,
            pushbackCount: answer.pushbackCount,
          };
        }
        return {
          questionIndex: answer.questionIndex,
          transcript: answer.transcript,
          useSubmittedTranscript: true,
          pushbackCount: answer.pushbackCount,
        };
      }),
  };
}
