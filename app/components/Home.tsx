"use client";

import { useState } from "react";
import Link from "next/link";
import type { LandingView } from "@/lib/content/landingView";
import { GoogleSignInDialog } from "./GoogleSignInDialog";
import { JoinInterview } from "./JoinInterview";
import { LanguageToggle } from "./LanguageToggle";
import { useCopy } from "./useUiLocale";

const HOW_IT_WORKS_STEPS = ["join", "speak", "report"] as const;

const SENSEI_NAME = "Tanaka-sensei";

const SIGNED_OUT_START: LandingView = {
  origin: "/",
  invite: "none",
  from: null,
  session: { kind: "signedOut" },
};

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

const HEADER_PILL =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d8f5b0] px-4 text-sm font-medium text-feather-dark shadow-[0_4px_7px_rgba(88,204,2,0.12)] transition-colors hover:bg-[#c8ee96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather";

/**
 * Join-link Login. Opens Google through join-google so the invite code is
 * carried into the callback. A different action than the plain /login link.
 */
function InviteLogin({ from }: { from: string }) {
  const { copy } = useCopy();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startGoogle() {
    setMessage(null);
    try {
      const res = await fetch("/api/auth/join-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from }),
      });
      const data = (await res.json()) as { url?: string; reason?: string };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.reason === "full") {
        setMessage(copy.joinLink.full);
        return;
      }
      if (data.reason === "unknown") {
        setMessage(copy.joinLink.unknown);
        return;
      }
      if (data.reason === "not_configured") {
        setMessage(copy.auth.notConfigured);
        return;
      }
      setMessage(copy.login.startFailed);
    } catch {
      setMessage(copy.login.startFailed);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
        className={HEADER_PILL}
      >
        {copy.joinLink.login}
      </button>
      {open ? (
        <GoogleSignInDialog
          title={copy.joinLink.title}
          body={copy.login.body}
          message={message}
          onClose={() => setOpen(false)}
          onContinue={startGoogle}
        />
      ) : null}
    </>
  );
}

export default function Home({ view = SIGNED_OUT_START }: { view?: LandingView }) {
  const { locale, setLocale, copy } = useCopy();
  const { origin, invite, from, session } = view;
  const [dismissedFullFor, setDismissedFullFor] = useState<string | null>(null);
  const fullNoticeOpen = invite === "full" && dismissedFullFor !== from;

  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] text-eel">
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
        <div className="ml-auto flex items-center gap-x-4">
          <LanguageToggle locale={locale} onChange={setLocale} />
          <div className="flex items-center">
            {session.kind === "signedIn" ? (
              <Link
                href={`/profile?returnTo=${encodeURIComponent(origin)}`}
                className={HEADER_PILL}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M4.5 20a7.5 7.5 0 0115 0" />
                </svg>
                {copy.account.profile}
              </Link>
            ) : invite === "open" && from ? (
              <InviteLogin from={from} />
            ) : invite === "none" ? (
              <Link href="/login" scroll={false} className={HEADER_PILL}>
                {copy.joinLink.login}
              </Link>
            ) : null}
          </div>
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

        {session.kind === "signedIn" ? (
          <div className="mt-10 hidden justify-center md:flex">
            {invite === "full" ? null : (
              <JoinInterview
                consentRequired={!session.consentedThisVisit}
                className="!text-xl"
              />
            )}
          </div>
        ) : invite === "unknown" ? (
          <p className="mx-auto mt-10 max-w-md text-sm text-eel/80">
            {copy.joinLink.unknown}
          </p>
        ) : (
          <div className="mt-10 hidden justify-center md:flex">
            <JoinInterview
              label={copy.start.tryAsGuest}
              guest
              trailing={<CtaArrow />}
            />
          </div>
        )}
        {session.kind !== "signedIn" && invite !== "unknown" ? (
          <p className="mt-3 hidden text-[12.5px] text-wolf md:block">
            {copy.start.guestCaption}
          </p>
        ) : null}
        <p className="mx-auto mt-5 max-w-[52ch] text-sm leading-relaxed text-wolf">
          {copy.start.practiceOnly}
        </p>

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

      {fullNoticeOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-eel/40 p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="full-link-title" className="relative w-full max-w-[440px] rounded-[20px] bg-white px-7 py-10 text-center text-eel shadow-[0_30px_70px_-20px_rgba(28,71,46,0.35)]">
            <button type="button" aria-label={copy.login.close} onClick={() => setDismissedFullFor(from)} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-wolf hover:bg-eel/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <h2 id="full-link-title" className="font-display text-xl font-bold">{copy.joinLink.full}</h2>
          </div>
        </div>
      ) : null}
    </div>
  );
}
