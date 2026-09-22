import { useEffect, useRef, useState } from "react";
import type { InterviewReport } from "@/lib/content/sampleReport";
import type { GradeCollection } from "./useGradeAnswers";

export function useInterviewScore(collection: GradeCollection) {
  const posted = useRef(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [scoringFailed, setScoringFailed] = useState(false);

  useEffect(() => {
    if (collection.status !== "ready" || posted.current) return;
    if (collection.answers.length === 0) return;
    posted.current = true;
    void fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: collection.answers }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          report?: InterviewReport | null;
        };
        if (data.report) {
          setReport(data.report);
          setScoringFailed(false);
        } else {
          setReport(null);
          setScoringFailed(true);
        }
      })
      .catch(() => {
        setReport(null);
        setScoringFailed(true);
      });
  }, [collection]);

  return { report, scoringFailed };
}
