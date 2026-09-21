"use client";

import { HashSessionCatcher } from "../HashSessionCatcher";
import { LanguageBar } from "../../components/LanguageBar";
import { useCopy } from "../../components/useUiLocale";

export default function AuthContinuePage() {
  const { copy } = useCopy();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <LanguageBar variant="light" />
      <main className="flex w-full max-w-md flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.auth.title}</h1>
        <HashSessionCatcher />
        <a href="/login" className="text-sm font-medium text-indigo">
          {copy.auth.participantLogin}
        </a>
      </main>
    </div>
  );
}
