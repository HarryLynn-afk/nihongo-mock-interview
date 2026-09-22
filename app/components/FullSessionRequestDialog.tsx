"use client";

import { useEffect, useState } from "react";
import {
  markFullSessionRequestSent,
  normalizeRequestEmail,
} from "@/lib/content/fullSessionRequest";
import { useCopy } from "./useUiLocale";

export type FullSessionRequestStep = "choice" | "form" | "saved";

export function FullSessionRequestDialog({
  step,
  showContinue,
  onContinueAsGuest,
  onLeaveEmail,
  onClose,
  onSent,
}: {
  step: FullSessionRequestStep;
  /** Start-page dialog can still enter the Guest classroom. */
  showContinue: boolean;
  onContinueAsGuest?: () => void;
  onLeaveEmail?: () => void;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { copy } = useCopy();
  const text = copy.fullSessionRequest;
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"invalid" | "save" | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const title =
    step === "choice"
      ? text.choiceTitle
      : step === "form"
        ? text.formTitle
        : text.savedTitle;

  async function sendEmail() {
    const normalized = normalizeRequestEmail(email);
    if (!normalized) {
      setError("invalid");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/full-session-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      if (!response.ok) {
        setError("save");
        setPending(false);
        return;
      }
      markFullSessionRequestSent();
      onSent?.();
    } catch {
      setError("save");
      setPending(false);
    }
  }

  return (
    <div
      data-testid="full-session-request-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-labelledby="full-session-request-title"
        data-testid="full-session-request"
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-paper/10 bg-ink p-5 text-paper"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="full-session-request-title" className="text-lg font-medium">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-paper/80"
          >
            {text.close}
          </button>
        </div>

        {step === "choice" ? (
          <>
            <p className="text-sm leading-relaxed text-paper/80">
              {text.choiceBody}
            </p>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="rounded-full bg-feather px-5 py-3 font-medium text-white"
            >
              {text.continueAsGuest}
            </button>
            <button
              type="button"
              onClick={onLeaveEmail}
              className="rounded-full border border-paper/20 px-5 py-3 text-sm font-medium"
            >
              {text.leaveEmail}
            </button>
          </>
        ) : null}

        {step === "form" ? (
          <>
            <p className="text-sm leading-relaxed text-paper/80">
              {text.formBody}
            </p>
            <label className="flex flex-col gap-1 text-sm">
              {text.emailLabel}
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                className="rounded-xl border border-paper/20 bg-paper/5 px-3 py-2 text-paper"
              />
            </label>
            {error === "invalid" ? (
              <p className="text-sm text-paper/80">{text.invalidEmail}</p>
            ) : null}
            {error === "save" ? (
              <p className="text-sm text-paper/80">{text.saveError}</p>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => void sendEmail()}
              className="rounded-full bg-indigo px-5 py-3 font-medium text-paper disabled:opacity-60"
            >
              {text.send}
            </button>
            {showContinue ? (
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-sm font-medium text-paper/80"
              >
                {text.continueAsGuest}
              </button>
            ) : null}
          </>
        ) : null}

        {step === "saved" ? (
          <>
            <p className="text-sm leading-relaxed text-paper/80">
              {text.savedBody}
            </p>
            {showContinue ? (
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="rounded-full bg-feather px-5 py-3 font-medium text-white"
              >
                {text.continueAsGuest}
              </button>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
