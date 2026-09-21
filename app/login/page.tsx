"use client";

import { useEffect, useState } from "react";
import { localizeAuthMessage } from "@/lib/content/uiCopy";
import { LanguageBar } from "../components/LanguageBar";
import { useCopy } from "../components/useUiLocale";

export default function LoginPage() {
  const { locale, copy } = useCopy();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "not_invited") {
      setMessage(copy.login.errorNotInvited);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startGoogle() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/login-google", { method: "POST" });
      const data = (await res.json()) as { url?: string | null };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setMessage(copy.auth.notConfigured);
    } catch {
      setMessage(copy.auth.notConfigured);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <LanguageBar variant="light" />
      <main className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.login.title}</h1>
        <p className="text-sm text-ink/70">{copy.login.body}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => void startGoogle()}
          className="rounded-full bg-indigo px-5 py-3 font-medium text-paper disabled:opacity-60"
        >
          {copy.login.google}
        </button>
        {message ? (
          <p className="text-sm text-ink/80">
            {localizeAuthMessage(message, locale)}
          </p>
        ) : null}
        <a href="/" className="text-sm font-medium text-indigo">
          {copy.login.tryAsGuest}
        </a>
      </main>
    </div>
  );
}
