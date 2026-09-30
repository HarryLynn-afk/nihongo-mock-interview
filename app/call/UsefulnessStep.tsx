"use client";

import { useEffect, useState } from "react";
import type { UiLocale } from "@/lib/content/locale";
import {
  OPEN_ENDED_KEYS,
  RATING_KEYS,
  type OpenEndedKey,
  type SurveyPayload,
  type SurveyRating,
  type SurveyRatings,
  type UsefulnessView,
} from "@/lib/content/survey";
import { uiCopy } from "@/lib/content/uiCopy";

const RATINGS: SurveyRating[] = [1, 2, 3, 4, 5];

export function UsefulnessStep({
  view,
  locale = "en",
  onFinished,
}: {
  view: UsefulnessView;
  locale?: UiLocale;
  onFinished?: (outcome: "skipped" | "submitted" | "dismissed") => void;
}) {
  const chrome = uiCopy(locale);
  const [ratings, setRatings] = useState<Partial<SurveyRatings>>({});
  const [openEnded, setOpenEnded] = useState<Record<OpenEndedKey, string>>({
    mostHelpful: "",
    unclear: "",
    improvement: "",
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onFinished?.("dismissed");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFinished]);

  function pick(entry: { english: string; burmese: string }): string {
    return locale === "my" ? entry.burmese : entry.english;
  }

  function post(payload: SurveyPayload) {
    void fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  const complete = RATING_KEYS.every((key) => ratings[key] !== undefined);

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
        className="flex max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-2xl border border-eel/10 bg-white p-5 text-eel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="help-the-study-title" className="text-lg font-medium">
            {chrome.usefulness.title}
          </h2>
          <button
            type="button"
            onClick={() => onFinished?.("dismissed")}
            className="rounded-full px-3 py-1 text-sm text-eel/90"
          >
            {chrome.usefulness.close}
          </button>
        </div>
        <p>{pick(view.copy.consent)}</p>
        <p className="text-xs text-eel/80">
          1 = {pick(view.copy.scale.low)} · 5 = {pick(view.copy.scale.high)}
        </p>

        {RATING_KEYS.map((key) => {
          const text = pick(view.copy.ratings[key]);
          return (
            <fieldset key={key} className="flex flex-col gap-2">
              <legend>{text}</legend>
              <div className="flex gap-3">
                {RATINGS.map((rating) => (
                  <label key={rating} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={key}
                      value={rating}
                      aria-label={`${text} ${rating}`}
                      onChange={() =>
                        setRatings((prev) => ({ ...prev, [key]: rating }))
                      }
                    />
                    {rating}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        {OPEN_ENDED_KEYS.map((key) => (
          <label key={key} className="flex flex-col gap-1">
            <span>{pick(view.copy.openEnded[key])}</span>
            <textarea
              value={openEnded[key]}
              onChange={(event) =>
                setOpenEnded((prev) => ({ ...prev, [key]: event.target.value }))
              }
              className="h-20 w-full rounded-xl border border-feather/30 bg-white px-4 py-3 text-eel"
            />
          </label>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!complete}
            onClick={() => {
              if (!complete) return;
              post({
                skipped: false,
                ratings: ratings as SurveyRatings,
                openEnded,
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
            {pick(view.copy.skip)}
          </button>
        </div>
      </section>
    </div>
  );
}
