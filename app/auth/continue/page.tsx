"use client";

import { HashSessionCatcher } from "../HashSessionCatcher";
import { LanguageBar } from "../../components/LanguageBar";
import { useCopy } from "../../components/useUiLocale";

export default function AuthContinuePage() {
  const { copy } = useCopy();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] px-6 py-16 text-eel">
      <LanguageBar />
      <main className="flex w-full max-w-md flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.auth.title}</h1>
        <HashSessionCatcher />
        <a href="/login" className="text-sm font-medium text-feather-dark hover:underline">
          {copy.auth.participantLogin}
        </a>
      </main>
    </div>
  );
}
