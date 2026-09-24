"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LandingView } from "@/lib/content/landingView";
import { HashSessionCatcher } from "../auth/HashSessionCatcher";
import { JoinInterview } from "./JoinInterview";
import { LanguageToggle } from "./LanguageToggle";
import { useCopy } from "./useUiLocale";

const HOW_IT_WORKS_STEPS = ["join", "speak", "report"] as const;

const SENSEI_NAME = "Tanaka-sensei";

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

export default function Home({
  catchAuth = true,
  hero,
  headerAction,
  view,
  inviteNote = false,
  joinDisabled = false,
}: {
  catchAuth?: boolean;
  /** Replaces Try as guest and the guest caption. Omit on the public start screen. */
  hero?: ReactNode;
  /** Replaces the header Participant login pill. Pass null to show none. */
  headerAction?: ReactNode | null;
  view?: LandingView;
  inviteNote?: boolean;
  joinDisabled?: boolean;
}) {
  const { locale, setLocale, copy } = useCopy();

  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] text-eel">
      {catchAuth ? <HashSessionCatcher idle /> : null}

      <header className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-6 md:px-12">
        <Link
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
        </Link>
        <div className="flex items-center">
          {view?.kind === "signedIn" ? (
            <Link
              href={`/profile?returnTo=${encodeURIComponent(view.origin)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d8f5b0] px-4 text-sm font-medium text-feather-dark shadow-[0_4px_7px_rgba(88,204,2,0.12)] transition-colors hover:bg-[#c8ee96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20a7.5 7.5 0 0115 0" />
              </svg>
              {copy.account.profile}
            </Link>
          ) : headerAction === undefined ? (
            <Link
              href="/login"
              scroll={false}
              className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-[#d8f5b0] px-6 text-sm font-medium text-feather-dark shadow-[0_4px_7px_rgba(88,204,2,0.12)] transition-colors hover:bg-[#c8ee96]"
            >
              {copy.joinLink.login}
            </Link>
          ) : (
            headerAction
          )}
        </div>
        <div className="ml-auto">
          <LanguageToggle
            locale={locale}
            onChange={setLocale}
            variant="light"
            tone="feather"
          />
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

        {view?.kind === "signedIn" ? (
          <div className="mt-10 hidden flex-col items-center gap-3 md:flex">
            {joinDisabled ? null : <JoinInterview tone="feather" consentRequired={!view.consentedThisVisit} />}
            <JoinInterview
              guest
              label={copy.start.tryAsGuest}
              tone="feather"
              className="!min-h-11 !bg-transparent !text-feather-dark !shadow-none hover:!bg-feather/10 hover:!shadow-none"
            />
          </div>
        ) : hero ?? (
          <div className="mt-10 hidden justify-center md:flex">
            <JoinInterview
              label={copy.start.tryAsGuest}
              guest
              tone="feather"
              trailing={<CtaArrow />}
            />
          </div>
        )}
        {hero || view?.kind === "signedIn" ? null : (
          <p className="mt-3 hidden text-[12.5px] text-wolf md:block">
            {copy.start.guestCaption}
          </p>
        )}
        {inviteNote && view?.kind !== "signedIn" ? (
          <p className="mx-auto mt-5 max-w-[48ch] text-sm leading-relaxed text-wolf">
            {copy.joinLink.explanation}
          </p>
        ) : null}

        <p className="mt-6 w-full rounded-lg border border-eel/10 bg-white/70 px-4 py-3 text-sm text-eel/80 md:hidden">
          {copy.start.computerOnly}
        </p>
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
