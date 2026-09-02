"use client";

import { useState } from "react";
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
}: {
  view: UsefulnessView;
  report: InterviewReport;
  answers: readonly SurveyAnswer[];
}) {
  const [usefulness, setUsefulness] = useState<SurveyRating | null>(null);
  const [usability, setUsability] = useState<SurveyRating | null>(null);
  const [comment, setComment] = useState("");

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
    <section
      data-testid="usefulness-step"
      className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-paper/10 bg-ink/90 p-5 text-paper"
    >
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
          }}
          className="rounded-full bg-indigo px-6 py-3 font-medium text-paper disabled:opacity-40"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={() => post({ skipped: true })}
          className="rounded-full bg-paper/10 px-6 py-3 font-medium text-paper"
        >
          <span>{view.copy.skip.english}</span>
          {" / "}
          <span>{view.copy.skip.burmese}</span>
        </button>
      </div>
    </section>
  );
}
