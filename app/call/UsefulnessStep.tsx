"use client";

import { useEffect, useState } from "react";
import type { InterviewReport } from "@/lib/content/sampleReport";
import type { UiLocale } from "@/lib/content/locale";
import {
  buildSurveyPayload,
  type SurveyAnswer,
  type SurveyRating,
  type UsefulnessView,
} from "@/lib/content/survey";
import { uiCopy } from "@/lib/content/uiCopy";

const RATINGS: SurveyRating[] = [1, 2, 3, 4, 5];

export function UsefulnessStep({
  view,
  report,
  answers,
  locale = "en",
  onFinished,
}: {
  view: UsefulnessView;
  report: InterviewReport;
  answers: readonly SurveyAnswer[];
  locale?: UiLocale;
  onFinished?: (outcome: "skipped" | "submitted" | "dismissed") => void;
}) {
  const chrome = uiCopy(locale);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-eel/40 p-6"
      onClick={() => onFinished?.("dismissed")}
    >
      <section
        role="dialog"
        aria-labelledby="help-the-study-title"
        data-testid="usefulness-step"
        className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-eel/10 bg-white p-5 text-eel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="help-the-study-title" className="text-lg font-medium">
            {chrome.usefulness.title}
          </h2>
          <button
            type="button"
            onClick={() => onFinished?.("dismissed")}
            className="rounded-full px-3 py-1 text-sm text-eel/80"
          >
            {chrome.usefulness.close}
          </button>
        </div>
        <p>
          {locale === "my" ? view.copy.consent.burmese : view.copy.consent.english}
        </p>
        <fieldset className="flex flex-col gap-2">
          <legend>
            {locale === "my"
              ? view.copy.usefulness.burmese
              : view.copy.usefulness.english}
          </legend>
          <p className="text-xs text-eel/60">
            1 ={" "}
            {locale === "my"
              ? view.copy.usefulness.scaleLowBurmese
              : view.copy.usefulness.scaleLowEnglish}{" "}
            · 5 ={" "}
            {locale === "my"
              ? view.copy.usefulness.scaleHighBurmese
              : view.copy.usefulness.scaleHighEnglish}
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
            {locale === "my"
              ? view.copy.usability.burmese
              : view.copy.usability.english}
          </legend>
          <p className="text-xs text-eel/60">
            1 ={" "}
            {locale === "my"
              ? view.copy.usability.scaleLowBurmese
              : view.copy.usability.scaleLowEnglish}{" "}
            · 5 ={" "}
            {locale === "my"
              ? view.copy.usability.scaleHighBurmese
              : view.copy.usability.scaleHighEnglish}
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
          aria-label={chrome.usefulness.comment}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="h-20 w-full rounded-xl border border-feather/30 bg-white px-4 py-3 text-eel"
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
            className="rounded-full bg-feather px-6 py-3 font-medium text-white disabled:opacity-40"
          >
            {chrome.usefulness.submit}
          </button>
          <button
            type="button"
            onClick={() => {
              post({ skipped: true });
              onFinished?.("skipped");
            }}
            className="rounded-full bg-eel/10 px-6 py-3 font-medium text-eel"
            aria-label="Skip"
          >
            {locale === "my" ? view.copy.skip.burmese : view.copy.skip.english}
          </button>
        </div>
      </section>
    </div>
  );
}
