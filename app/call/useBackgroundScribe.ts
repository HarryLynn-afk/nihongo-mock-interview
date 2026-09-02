import { useEffect, useRef, useState } from "react";
import type { QuestionPhase, StoredAnswer } from "./useQuestionFlow";

export type AnswerForScoring = {
  questionIndex: number;
  inputMode: "voice" | "typed";
  transcript: string;
  useSubmittedTranscript: boolean;
  pushbackCount: 0 | 1 | 2;
  forced: boolean;
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
      if (answer.inputMode !== "voice") continue;
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

  const voicePending =
    !dropped &&
    answers.some(
      (answer) =>
        answer.inputMode === "voice" &&
        answer.audioClip.size > 0 &&
        outcomes[answer.questionIndex] === undefined,
    );

  if (phase !== "done" || voicePending) {
    return { status: "collecting" };
  }

  return {
    status: "ready",
    answers: answers.map((answer) => {
      const pushback = {
        pushbackCount: answer.pushbackCount,
        forced: answer.forced,
      };
      if (answer.inputMode === "typed") {
        return {
          questionIndex: answer.questionIndex,
          inputMode: "typed" as const,
          transcript: answer.transcript,
          useSubmittedTranscript: true,
          ...pushback,
        };
      }
      const outcome = outcomes[answer.questionIndex];
      if (outcome?.kind === "scribe") {
        return {
          questionIndex: answer.questionIndex,
          inputMode: "voice" as const,
          transcript: outcome.text,
          useSubmittedTranscript: false,
          ...pushback,
        };
      }
      return {
        questionIndex: answer.questionIndex,
        inputMode: "voice" as const,
        transcript: answer.transcript,
        useSubmittedTranscript: true,
        ...pushback,
      };
    }),
  };
}
