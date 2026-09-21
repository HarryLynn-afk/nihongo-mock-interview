"use client";

import { useRouter } from "next/navigation";
import { LanguageBar } from "../components/LanguageBar";
import { useCopy } from "../components/useUiLocale";

/**
 * Unlocked Pitch landing. Shown only after the gate cookie is set.
 * Start demo skips the lobby and goes straight to `/call?pitch=1`.
 */
export function PitchLanding() {
  const router = useRouter();
  const { copy } = useCopy();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-center text-paper">
      <LanguageBar variant="dark" />
      <p className="mb-10 text-lg font-bold tracking-tight">NihonGo</p>

      <span className="mb-6 inline-block rounded-full border border-indigo/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo/80">
        {copy.pitch.chip}
      </span>

      <h1 className="text-4xl font-semibold tracking-tight">{copy.pitch.heading}</h1>

      <p className="mt-4 max-w-md text-paper/70">{copy.pitch.body}</p>

      <button
        type="button"
        onClick={() => router.push("/call?pitch=1")}
        className="mt-8 rounded-full bg-indigo px-8 py-3 font-medium text-paper transition-colors hover:bg-indigo/90"
      >
        {copy.pitch.startDemo}
      </button>

      <p className="mt-8 text-xs text-paper/45">{copy.pitch.footer}</p>
    </div>
  );
}
