"use client";

import { useRouter } from "next/navigation";

/**
 * Pitch mode's own landing route — the CSC 492 oral-exam / project-
 * presentation demo path. Not linked from `/`; reached directly at `/pitch`.
 * Start demo skips the lobby and device dialog entirely and goes straight
 * to `/call?pitch=1`, matching how `/call` already reads `?pitch=1`.
 */
export default function PitchLanding() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-center text-paper">
      <p className="mb-10 text-lg font-bold tracking-tight">NihonGo</p>

      <span className="mb-6 inline-block rounded-full border border-indigo/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo/80">
        Presentation demo
      </span>

      <h1 className="text-4xl font-semibold tracking-tight">Pitch mode</h1>

      <p className="mt-4 max-w-md text-paper/70">
        Three locked questions, guided captions, and the live coaching report
        — the CSC 492 oral-exam walkthrough.
      </p>

      <button
        type="button"
        onClick={() => router.push("/call?pitch=1")}
        className="mt-8 rounded-full bg-indigo px-8 py-3 font-medium text-paper transition-colors hover:bg-indigo/90"
      >
        Start demo
      </button>

      <p className="mt-8 text-xs text-paper/45">
        This page is not linked from the app. Reach it directly at /pitch.
      </p>
    </div>
  );
}
