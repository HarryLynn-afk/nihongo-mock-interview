import { useMemo } from "react";
import {
  summarizeDelivery,
  unableClip,
  type SessionDelivery,
} from "@/lib/content/deliverySignals";
import type { QuestionPhase, StoredAnswer } from "./useQuestionFlow";

export type DeliveryCollection =
  | { status: "collecting" }
  | { status: "ready"; delivery: SessionDelivery };

export function useDeliverySignals({
  answers,
  phase,
}: {
  answers: StoredAnswer[];
  phase: QuestionPhase;
  /** @deprecated PCM analysis is no longer used for coaching. */
  finishWaitMs?: number;
  /** @deprecated PCM analysis is no longer used for coaching. */
  analyzeClip?: unknown;
}): DeliveryCollection {
  const delivery = useMemo(() => {
    const spoken = answers.filter(
      (answer): answer is StoredAnswer & { status: "answered" } =>
        answer.status === "answered",
    );
    return summarizeDelivery(
      spoken.map((answer) => {
        if (answer.audioClip.size === 0 && !answer.wordTimings?.length) {
          return {
            questionIndex: answer.questionIndex,
            questionId: answer.questionId,
            signal: unableClip("empty"),
          };
        }
        return {
          questionIndex: answer.questionIndex,
          questionId: answer.questionId,
          words: answer.wordTimings,
        };
      }),
    );
  }, [answers]);

  if (phase !== "done") {
    return { status: "collecting" };
  }

  return { status: "ready", delivery };
}
