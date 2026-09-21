"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { HashSessionCatcher } from "./auth/HashSessionCatcher";
import { JoinInterview } from "./components/JoinInterview";
import { LanguageBar } from "./components/LanguageBar";
import { useCopy } from "./components/useUiLocale";

const GLANCE_FACTS = [
  { id: "camera", icon: CameraIcon },
  { id: "speak", icon: SpeakIcon },
  { id: "report", icon: ReportIcon },
  { id: "duration", icon: ClockIcon },
] as const;

function GlanceIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0 text-indigo"
    >
      {children}
    </svg>
  );
}

function CameraIcon() {
  return (
    <GlanceIcon>
      <path d="M4 8h3.2L9 6h6l1.8 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3" />
    </GlanceIcon>
  );
}

function SpeakIcon() {
  return (
    <GlanceIcon>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 12a6 6 0 0 0 12 0" />
      <path d="M12 18v3" />
    </GlanceIcon>
  );
}

function ReportIcon() {
  return (
    <GlanceIcon>
      <path d="M7 3h7l5 5v13H7Z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6" />
      <path d="M10 17h4" />
    </GlanceIcon>
  );
}

function ClockIcon() {
  return (
    <GlanceIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </GlanceIcon>
  );
}

export default function Home() {
  const { locale, copy } = useCopy();

  return (
    <div className="relative flex min-h-screen flex-col bg-paper text-ink">
      <HashSessionCatcher idle />
      <LanguageBar variant="light" />

      <header className="mx-auto flex w-full max-w-[1216px] items-center justify-between px-6 pt-8 md:px-12">
        <p className="text-lg font-bold tracking-tight">NihonGo</p>
      </header>

      <main className="mx-auto grid w-full max-w-[1216px] flex-1 items-center px-6 py-10 md:grid-cols-[minmax(0,590px)_1fr] md:gap-x-10 md:px-12 md:py-14">
        <div>
          <h1
            className={`max-w-[640px] text-[40px] font-bold md:text-[64px] ${
              locale === "my"
                ? "font-sans leading-[1.35]"
                : "font-serif leading-[1.05]"
            }`}
            lang={locale === "my" ? "my" : undefined}
          >
            {copy.start.headline}
          </h1>
          <p className="mt-5 max-w-[420px] text-xl text-ink/65">
            {copy.start.subhead}
          </p>

          <div className="mt-8 hidden w-full max-w-[584px] flex-col gap-4 md:flex md:flex-row">
            <JoinInterview
              label={copy.start.tryAsGuest}
              className="md:flex-1"
              guest
            />
            <a
              href="/login"
              className="inline-flex h-[60px] w-full items-center justify-center rounded-full bg-white px-5 text-lg font-medium text-ink/65 shadow-[0_4px_7px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f4f4f4] md:flex-1"
            >
              {copy.start.participantLogin}
            </a>
          </div>
          <p className="mt-3 hidden text-[12.5px] text-ink/65 md:block">
            {copy.start.guestCaption}
          </p>

          <p className="mt-6 w-full rounded-lg border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70 md:hidden">
            {copy.start.computerOnly}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {GLANCE_FACTS.map((fact) => (
              <span
                key={fact.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-[13px] text-ink/65"
              >
                <fact.icon />
                {copy.start.facts[fact.id]}
              </span>
            ))}
          </div>
        </div>

        <figure className="hidden overflow-hidden rounded-3xl bg-ink shadow-[0_24px_60px_rgba(15,23,42,0.25)] md:block">
          <div className="relative aspect-[4/3.6] w-full">
            <Image
              src="/tanaka-sensei.png"
              alt="Tanaka-sensei"
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="px-5 py-3.5 text-sm text-paper">
            Tanaka-sensei
          </figcaption>
        </figure>
      </main>
    </div>
  );
}
