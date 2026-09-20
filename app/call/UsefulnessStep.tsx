"use client";

import { useEffect, useState } from "react";
import type { InterviewReport } from "@/lib/content/sampleReport";
import {
  buildSurveyPayload,
  type SurveyAnswer,
  type SurveyRating,
  type UsefulnessView,
} from "@/lib/content/survey";

const RATINGS: SurveyRating[] = [1, 2, 3, 4, 5];

export function UsefulnessStep({
  view,
  report,
  answers,
  onFinished,
}: {
  view: UsefulnessView;
  report: InterviewReport;
  answers: readonly SurveyAnswer[];
  onFinished?: (outcome: "skipped" | "submitted" | "dismissed") => void;
}) {
  const [usefulness, setUsefulness] = useState<SurveyRating | null>(null);
  const [usability, setUsability] = useState<SurveyRating | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onFinished?.("dismissed");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFinished]);

  function post(outcome: Parameters<typeof buildSurveyPayload>[0]["outcome"]) {
    const payload = buildSurveyPayload({
      report,
      answers,
      sessionId: view.sessionId,
      outcome,
    });
    void fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  return (
    <div
      data-testid="usefulness-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
      onClick={() => onFinished?.("dismissed")}
    >
      <section
        role="dialog"
        aria-labelledby="help-the-study-title"
        data-testid="usefulness-step"
        className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-paper/10 bg-ink p-5 text-paper"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="help-the-study-title" className="text-lg font-medium">
            Help the study
          </h2>
          <button
            type="button"
            onClick={() => onFinished?.("dismissed")}
            className="rounded-full px-3 py-1 text-sm text-paper/80"
          >
            Close
          </button>
        </div>
        <p>{view.copy.consent.english}</p>
        <p className="text-paper/80">{view.copy.consent.burmese}</p>
        <fieldset className="flex flex-col gap-2">
          <legend>
            <span className="block">{view.copy.usefulness.english}</span>
            <span className="block text-sm text-paper/80">
              {view.copy.usefulness.burmese}
            </span>
          </legend>
          <p className="text-xs text-paper/60">
            1 = {view.copy.usefulness.scaleLowEnglish} /{" "}
            {view.copy.usefulness.scaleLowBurmese} · 5 ={" "}
            {view.copy.usefulness.scaleHighEnglish} /{" "}
            {view.copy.usefulness.scaleHighBurmese}
          </p>
          <div className="flex gap-3">
            {RATINGS.map((rating) => (
              <label key={`usefulness-${rating}`} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="usefulness"
                  value={rating}
                  aria-label={`Usefulness ${rating}`}
                  onChange={() => setUsefulness(rating)}
                />
                {rating}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend>
            <span className="block">{view.copy.usability.english}</span>
            <span className="block text-sm text-paper/80">
              {view.copy.usability.burmese}
            </span>
          </legend>
          <p className="text-xs text-paper/60">
            1 = {view.copy.usability.scaleLowEnglish} /{" "}
            {view.copy.usability.scaleLowBurmese} · 5 ={" "}
            {view.copy.usability.scaleHighEnglish} /{" "}
            {view.copy.usability.scaleHighBurmese}
          </p>
          <div className="flex gap-3">
            {RATINGS.map((rating) => (
              <label key={`usability-${rating}`} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="usability"
                  value={rating}
                  aria-label={`Usability ${rating}`}
                  onChange={() => setUsability(rating)}
                />
                {rating}
              </label>
            ))}
          </div>
        </fieldset>
        <textarea
          aria-label="Comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-20 w-full rounded-xl border border-indigo/30 bg-ink px-4 py-3 text-paper"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={usefulness === null || usability === null}
            onClick={() => {
              if (usefulness === null || usability === null) return;
              post({
                skipped: false,
                usefulness,
                usability,
                comment,
              });
              onFinished?.("submitted");
            }}
            className="rounded-full bg-indigo px-6 py-3 font-medium text-paper disabled:opacity-40"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => {
              post({ skipped: true });
              onFinished?.("skipped");
            }}
            className="rounded-full bg-paper/10 px-6 py-3 font-medium text-paper"
          >
            <span>{view.copy.skip.english}</span>
            {" / "}
            <span>{view.copy.skip.burmese}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
