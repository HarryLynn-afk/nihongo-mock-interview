"use client";

import { useEffect, useRef, useState } from "react";
import { localizeAuthMessage } from "@/lib/content/uiCopy";
import { LanguageToggle } from "./LanguageToggle";
import { useCopy } from "./useUiLocale";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.5 5.5C39.9 37.4 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="size-4"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Sign-in popup. The caller decides which Google start runs and how Close
 * leaves. This dialog does not know about invite codes or allowlists.
 */
export function GoogleSignInDialog({
  title,
  body,
  onContinue,
  onClose,
  message,
}: {
  title: string;
  body: string;
  onContinue: () => Promise<void>;
  onClose: () => void;
  message?: string | null;
}) {
  const { locale, setLocale, copy } = useCopy();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const route = document.getElementById("nihongo-route");
    let inertedRoute: HTMLElement | null = null;
    if (route && dialogRef.current && !route.contains(dialogRef.current)) {
      route.setAttribute("inert", "");
      inertedRoute = route;
    }
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      inertedRoute?.removeAttribute("inert");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function continueSignIn() {
    if (pending) return;
    setPending(true);
    try {
      await onContinue();
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-sign-in-title"
        tabIndex={-1}
        className="login-dialog-in relative w-full max-w-[440px] rounded-[20px] bg-paper px-6 pb-7 pt-14 text-center shadow-[0_40px_80px_-20px_rgba(20,30,20,0.35)] outline-none sm:px-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute left-4 top-4">
          <LanguageToggle
            locale={locale}
            onChange={setLocale}
            variant="light"
            tone="feather"
          />
        </div>
        <button
          type="button"
          aria-label={copy.login.close}
          onClick={onClose}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-wolf hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
        >
          <CloseIcon />
        </button>

        <p className="font-display text-[1.15rem] font-bold tracking-tight text-feather">
          NihonGo
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block -translate-y-1.5 text-sm text-macaw"
          >
            ✦
          </span>
        </p>
        <h2
          id="google-sign-in-title"
          className="mt-6 font-display text-[1.3rem] font-bold tracking-tight text-eel"
          lang={locale === "my" ? "my" : undefined}
        >
          {title}
        </h2>

        <button
          type="button"
          disabled={pending}
          onClick={() => void continueSignIn()}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-swan bg-white px-4 text-[0.94rem] font-semibold text-eel transition-colors hover:bg-polar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather disabled:opacity-60"
        >
          <GoogleMark />
          {copy.login.google}
        </button>
        {message ? (
          <p className="mt-3 text-sm leading-relaxed text-[#9b1c1c]">
            {localizeAuthMessage(message, locale)}
          </p>
        ) : null}
        <p className="mx-auto mt-4 max-w-[34ch] text-[0.92rem] leading-relaxed text-wolf">
          {body}
        </p>
      </div>
    </div>
  );
}
