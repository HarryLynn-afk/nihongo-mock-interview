"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PitchUnlockForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/pitch/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-center text-paper">
      <p className="mb-10 text-lg font-bold tracking-tight">NihonGo</p>

      <span className="mb-6 inline-block rounded-full border border-indigo/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo/80">
        Presentation demo
      </span>

      <h1 className="text-4xl font-semibold tracking-tight">Pitch mode</h1>
      <p className="mt-4 max-w-md text-paper/70">This demo is locked.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex w-full max-w-sm flex-col gap-3 text-left"
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          Access key
          <input
            type="password"
            autoComplete="off"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            className="rounded-xl border border-paper/15 bg-ink px-4 py-3 font-normal text-paper"
            required
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-indigo px-8 py-3 font-medium text-paper transition-colors hover:bg-indigo/90 disabled:opacity-60"
        >
          Unlock
        </button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-paper/80">That key did not work.</p>
      ) : null}

      <p className="mt-8 text-xs text-paper/45">
        This page is not linked from the app.
      </p>
    </div>
  );
}
