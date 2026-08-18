import { useEffect, useRef } from "react";
import type { ScribeCollection } from "./useBackgroundScribe";

export function useInterviewScore(collection: ScribeCollection) {
  const posted = useRef(false);

  useEffect(() => {
    if (collection.status !== "ready" || posted.current) return;
    posted.current = true;
    void fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: collection.answers.map(
          ({ questionIndex, inputMode, transcript }) => ({
            questionIndex,
            inputMode,
            transcript,
          }),
        ),
      }),
    }).catch(() => {});
  }, [collection]);
}
