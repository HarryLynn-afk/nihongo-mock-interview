import { useEffect, useRef, useState } from "react";
import {
  getSampleReport,
  SCORING_UNAVAILABLE_BANNER,
  type InterviewReport,
} from "@/lib/content/sampleReport";
import type { ScribeCollection } from "./useBackgroundScribe";

export function useInterviewScore(collection: ScribeCollection) {
  const posted = useRef(false);
  const [report, setReport] = useState<InterviewReport | null>(null);

  useEffect(() => {
    if (collection.status !== "ready" || posted.current) return;
    posted.current = true;
    void fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: collection.answers.map(
          ({ useSubmittedTranscript: _omit, ...gradeAnswer }) => gradeAnswer,
        ),
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          report?: InterviewReport | null;
        };
        setReport(
          data.report ?? getSampleReport(SCORING_UNAVAILABLE_BANNER),
        );
      })
      .catch(() => {
        setReport(getSampleReport(SCORING_UNAVAILABLE_BANNER));
      });
  }, [collection]);

  return { report };
}
