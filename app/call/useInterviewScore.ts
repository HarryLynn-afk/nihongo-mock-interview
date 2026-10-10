import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewReport } from "@/lib/content/sampleReport";
import type { GradeCollection } from "./useGradeAnswers";
import type { StoredAnswer } from "./useQuestionFlow";

export function useInterviewScore(
  collection: GradeCollection,
  participant?: { attemptToken: string; sessionAnswers: StoredAnswer[] },
) {
  const posted = useRef(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [scoringFailed, setScoringFailed] = useState(false);
  const [studySave, setStudySave] = useState<"saved" | "retry" | null>(null);

  const submit = useCallback(async () => {
    if (collection.status !== "ready") return;
    const body = participant
      ? {
          attemptToken: participant.attemptToken,
          answers: participant.sessionAnswers.map((answer) => ({
            questionIndex: answer.questionIndex,
            questionId: answer.questionId,
            status: answer.status,
            transcript: answer.status === "answered" ? answer.transcript : "",
            pushbackCount: answer.status === "answered" ? answer.pushbackCount : 0,
            isFollowUp: Boolean(answer.isFollowUp),
          })),
        }
      : { answers: collection.answers };
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Scoring request failed");
      const data = (await res.json()) as {
        report?: InterviewReport | null;
        studySave?: "saved" | "retry";
      };
      if (data.report) {
        setReport(data.report);
        setScoringFailed(false);
        setStudySave(participant ? data.studySave ?? "retry" : null);
      } else {
        setReport(null);
        setScoringFailed(true);
      }
    } catch {
      setScoringFailed(true);
      if (participant) setStudySave("retry");
    }
  }, [collection, participant]);

  useEffect(() => {
    if (collection.status !== "ready" || posted.current) return;
    if (collection.answers.length === 0) return;
    posted.current = true;
    void Promise.resolve().then(submit);
  }, [collection, submit]);

  return { report, scoringFailed, studySave, retrySave: submit };
}
