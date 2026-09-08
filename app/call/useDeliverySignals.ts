import { useEffect, useRef, useState } from "react";
import {
  notAssessedClip,
  summarizeDelivery,
  type AnalyzedClip,
  type SessionDelivery,
} from "@/lib/content/deliverySignals";
import { analyzeAudioClip } from "./analyzeAudioClip";
import type { QuestionPhase, StoredAnswer } from "./useQuestionFlow";

export type DeliveryCollection =
  | { status: "collecting" }
  | { status: "ready"; delivery: SessionDelivery };

export function useDeliverySignals({
  answers,
  phase,
  finishWaitMs = 3_000,
  analyzeClip = analyzeAudioClip,
}: {
  answers: StoredAnswer[];
  phase: QuestionPhase;
  finishWaitMs?: number;
  analyzeClip?: (clip: Blob, transcript: string) => Promise<AnalyzedClip>;
}): DeliveryCollection {
  const started = useRef(new Set<number>());
  const droppedRef = useRef(false);
  const [signals, setSignals] = useState<Record<number, AnalyzedClip>>({});
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    for (const answer of answers) {
      if (answer.inputMode !== "voice") continue;
      if (started.current.has(answer.questionIndex)) continue;
      started.current.add(answer.questionIndex);

      if (answer.audioClip.size === 0) {
        setSignals((current) => ({
          ...current,
          [answer.questionIndex]: notAssessedClip(),
        }));
        continue;
      }

      void analyzeClip(answer.audioClip, answer.transcript)
        .then((signal) => {
          if (droppedRef.current) return;
          setSignals((current) => ({
            ...current,
            [answer.questionIndex]: signal,
          }));
        })
        .catch(() => {
          if (droppedRef.current) return;
          setSignals((current) => ({
            ...current,
            [answer.questionIndex]: notAssessedClip(),
          }));
        });
    }
  }, [answers, analyzeClip]);

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
        signals[answer.questionIndex] === undefined,
    );

  if (phase !== "done" || voicePending) {
    return { status: "collecting" };
  }

  return {
    status: "ready",
    delivery: summarizeDelivery(
      answers.map((answer) => ({
        questionIndex: answer.questionIndex,
        inputMode: answer.inputMode,
        signal:
          answer.inputMode === "voice"
            ? (signals[answer.questionIndex] ?? notAssessedClip())
            : null,
      })),
    ),
  };
}
