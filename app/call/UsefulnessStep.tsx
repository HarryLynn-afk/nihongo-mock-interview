"use client";

import { useEffect, useState } from "react";
import type { UiLocale } from "@/lib/content/locale";
import {
  OPEN_ENDED_KEYS,
  MAX_SURVEY_TEXT_LENGTH,
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
  onSubmit,
  onFinished,
}: {
  view: UsefulnessView;
  locale?: UiLocale;
  onSubmit: (payload: SurveyPayload) => Promise<"submitted" | "retry" | "uncertain">;
  onFinished?: (outcome: "skipped" | "submitted" | "dismissed") => void;
}) {
  const chrome = uiCopy(locale);
  const [ratings, setRatings] = useState<Partial<SurveyRatings>>({});
  const [openEnded, setOpenEnded] = useState<Record<OpenEndedKey, string>>({
    mostHelpful: "",
    unclear: "",
    improvement: "",
  });
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [sendUncertain, setSendUncertain] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !sending) onFinished?.("dismissed");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFinished, sending]);

  function pick(entry: { english: string; burmese: string }): string {
    return locale === "my" ? entry.burmese : entry.english;
  }

  async function submit(payload: SurveyPayload) {
    setSending(true);
    setSendFailed(false);
    let outcome: "submitted" | "retry" | "uncertain" = "uncertain";
    try {
      outcome = await onSubmit(payload);
    } catch {
      // A lost response cannot establish whether the form received the answers.
    }
    setSending(false);
    if (outcome === "submitted") onFinished?.("submitted");
    else if (outcome === "uncertain") setSendUncertain(true);
    else setSendFailed(true);
  }

  const complete = RATING_KEYS.every((key) => ratings[key] !== undefined);

  return (
    <div
      data-testid="usefulness-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-eel/40 p-6"
      onClick={() => { if (!sending) onFinished?.("dismissed"); }}
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
            disabled={sending}
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
              maxLength={MAX_SURVEY_TEXT_LENGTH}
              onChange={(event) =>
                setOpenEnded((prev) => ({ ...prev, [key]: event.target.value }))
              }
              className="h-20 w-full rounded-xl border border-feather/30 bg-white px-4 py-3 text-eel"
            />
          </label>
        ))}

        {sendFailed ? (
          <p role="alert" className="text-sm text-red-700">
            {chrome.usefulness.sendFailed}
          </p>
        ) : null}
        {sendUncertain ? (
          <p role="alert" className="text-sm text-red-700">
            {chrome.usefulness.sendUncertain}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!complete || sending || sendUncertain}
            onClick={() => {
              if (!complete) return;
              void submit({
                skipped: false,
                ratings: ratings as SurveyRatings,
                openEnded,
              });
            }}
            className="rounded-full bg-feather px-6 py-3 font-medium text-white disabled:opacity-40"
          >
            {chrome.usefulness.submit}
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => onFinished?.("skipped")}
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
