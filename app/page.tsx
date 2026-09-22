"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HashSessionCatcher } from "./auth/HashSessionCatcher";
import { JoinInterview } from "./components/JoinInterview";
import { LanguageToggle } from "./components/LanguageToggle";
import { useCopy } from "./components/useUiLocale";

const GLANCE_FACTS = [
  { id: "speak", icon: SpeakIcon },
  { id: "report", icon: ReportIcon },
  { id: "duration", icon: ClockIcon },
] as const;

const HOW_IT_WORKS_STEPS = ["join", "speak", "report"] as const;

const SENSEI_NAME = "Tanaka-sensei";

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
      className="size-3.5 shrink-0 text-feather-dark"
    >
      {children}
    </svg>
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

function CtaArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function AccentHeadline({ text }: { text: string }) {
  const index = text.indexOf(SENSEI_NAME);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const after = text.slice(index + SENSEI_NAME.length);
  const breakBeforeName = before.trimEnd().endsWith("with");

  return (
    <>
      {breakBeforeName ? (
        <>
          {before.slice(0, before.toLowerCase().lastIndexOf("with"))}
          <br />
          with{" "}
        </>
      ) : (
        before
      )}
      <span className="bg-gradient-to-r from-feather to-macaw bg-clip-text text-transparent">
        {SENSEI_NAME}
      </span>
      {after ? (
        <>
          {before ? null : <br />}
          {after}
        </>
      ) : null}
    </>
  );
}

export default function Home({ catchAuth = true }: { catchAuth?: boolean }) {
  const { locale, setLocale, copy } = useCopy();

  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] text-eel">
      {catchAuth ? <HashSessionCatcher idle /> : null}

      <header className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-6 md:px-12">
        <a
          href="/"
          className="font-display text-[1.5rem] font-bold tracking-tight text-feather"
        >
          NihonGo
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block -translate-y-2 text-base text-macaw"
          >
            ✦
          </span>
        </a>
        <div className="ml-auto flex items-center gap-3 md:gap-4">
          <LanguageToggle
            locale={locale}
            onChange={setLocale}
            variant="light"
            tone="feather"
          />
          <Link
            href="/login"
            scroll={false}
            className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-[#d8f5b0] px-6 text-sm font-medium text-feather-dark shadow-[0_4px_7px_rgba(88,204,2,0.12)] transition-colors hover:bg-[#c8ee96]"
          >
            {copy.start.participantLogin}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-0 pt-8 text-center md:px-6 md:pt-16">
        <h1
          className={`font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-extrabold tracking-[-0.02em] ${
            locale === "my" ? "font-sans leading-[1.35]" : "leading-[1.05]"
          }`}
          lang={locale === "my" ? "my" : undefined}
        >
          <AccentHeadline text={copy.start.headline} />
        </h1>
        <p className="mx-auto mt-8 max-w-[40ch] text-lg leading-relaxed text-wolf md:text-xl">
          {copy.start.subhead}
        </p>

        <div className="mt-10 hidden justify-center md:flex">
          <JoinInterview
            label={copy.start.tryAsGuest}
            guest
            tone="feather"
            trailing={<CtaArrow />}
          />
        </div>
        <p className="mt-3 hidden text-[12.5px] text-wolf md:block">
          {copy.start.guestCaption}
        </p>

        <p className="mt-6 w-full rounded-lg border border-eel/10 bg-white/70 px-4 py-3 text-sm text-eel/80 md:hidden">
          {copy.start.computerOnly}
        </p>

        <div className="mx-auto mt-8 flex max-w-[520px] flex-wrap items-center justify-center gap-2">
          {GLANCE_FACTS.map((fact) => (
            <span
              key={fact.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[13px] text-wolf ring-1 ring-feather/15"
            >
              <fact.icon />
              {copy.start.facts[fact.id]}
            </span>
          ))}
        </div>
      </main>

      <section
        id="how-it-works"
        className="mx-auto w-full max-w-[1100px] px-5 pb-20 pt-16 text-center md:px-6 md:pt-24"
      >
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.02em] text-eel">
          {copy.start.howItWorks.title}
        </h2>
        <ol className="mt-10 grid gap-8 text-left md:grid-cols-3 md:gap-10">
          {HOW_IT_WORKS_STEPS.map((id, index) => {
            const step = copy.start.howItWorks.steps[id];
            return (
              <li key={id}>
                <p className="text-sm font-medium tracking-[0.04em] text-feather-dark">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-lg font-semibold text-eel">{step.title}</p>
                <p className="mt-2 text-base leading-relaxed text-wolf">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
