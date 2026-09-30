"use client";

import { useEffect, useState } from "react";
import {
  markFullSessionRequestSent,
  normalizeRequestEmail,
} from "@/lib/content/fullSessionRequest";
import { useCopy } from "./useUiLocale";

export type FullSessionRequestStep = "form" | "saved";

export function FullSessionRequestDialog({
  step,
  onClose,
  onSent,
}: {
  step: FullSessionRequestStep;
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

  const title = step === "form" ? text.formTitle : text.savedTitle;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-eel/40 p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-labelledby="full-session-request-title"
        data-testid="full-session-request"
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-eel/10 bg-white p-5 text-eel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="full-session-request-title" className="text-lg font-medium">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-eel/90"
          >
            {text.close}
          </button>
        </div>
        {step === "form" ? (
          <>
            <p className="text-sm leading-relaxed text-eel/90">
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
                className="rounded-xl border border-eel/20 bg-eel/5 px-3 py-2 text-eel"
              />
            </label>
            {error === "invalid" ? (
              <p className="text-sm text-eel/90">{text.invalidEmail}</p>
            ) : null}
            {error === "save" ? (
              <p className="text-sm text-eel/90">{text.saveError}</p>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => void sendEmail()}
              className="rounded-full bg-feather px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {text.send}
            </button>
          </>
        ) : null}

        {step === "saved" ? (
          <p className="text-sm leading-relaxed text-eel/90">
            {text.savedBody}
          </p>
        ) : null}
      </section>
    </div>
  );
}
