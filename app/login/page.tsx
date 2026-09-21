"use client";

import { FormEvent, useState } from "react";
import { MAGIC_LINK_COPY } from "@/lib/content/studyAuth";
import { localizeAuthMessage } from "@/lib/content/uiCopy";
import { LanguageBar } from "../components/LanguageBar";
import { useCopy } from "../components/useUiLocale";

export default function LoginPage() {
  const { locale, copy } = useCopy();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string };
      setMessage(data.message ?? MAGIC_LINK_COPY);
    } catch {
      setMessage(MAGIC_LINK_COPY);
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
        <p className="text-sm font-medium text-ink/50">{copy.login.orEmail}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-left text-sm font-medium">
            {copy.login.email}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-ink/15 bg-paper px-4 py-3 font-normal"
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-ink/15 bg-paper px-5 py-3 font-medium text-ink disabled:opacity-60"
          >
            {copy.login.send}
          </button>
        </form>
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
