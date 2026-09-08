"use client";

import { FormEvent, useState } from "react";
import { MAGIC_LINK_COPY } from "@/lib/content/studyAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <main className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Participant login</h1>
        <p className="text-sm text-ink/70">
          Invited testers receive a sign-in link. Guest practice stays on the
          start screen and is never merged into the study.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-left text-sm font-medium">
            Email
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
            className="rounded-full bg-indigo px-5 py-3 font-medium text-paper disabled:opacity-60"
          >
            Send sign-in link
          </button>
        </form>
        {message ? <p className="text-sm text-ink/80">{message}</p> : null}
        <a href="/" className="text-sm font-medium text-indigo">
          Try as guest
        </a>
      </main>
    </div>
  );
}
