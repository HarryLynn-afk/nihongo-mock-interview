"use client";

import { useState } from "react";
import type { JoinPageView } from "@/lib/content/joinLink";
import type { LandingView } from "@/lib/content/landingView";
import { GoogleSignInDialog } from "../components/GoogleSignInDialog";
import Home from "../components/Home";
import { useCopy } from "../components/useUiLocale";

function JoinLoginButton({ from }: { from: string }) {
  const { copy } = useCopy();
  const [open, setOpen] = useState(false);

  async function startGoogle() {
    const res = await fetch("/api/auth/join-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from }),
    });
    const data = (await res.json()) as { url?: string | null };
    if (data.url) {
      window.location.assign(data.url);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[60px] items-center justify-center rounded-full bg-feather px-8 py-3 text-lg font-medium text-white shadow-[0_14px_30px_-10px_rgba(88,204,2,0.55)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-feather-dark hover:shadow-[0_18px_34px_-10px_rgba(88,204,2,0.65)]"
      >
        {copy.joinLink.login}
      </button>
      {open ? (
        <GoogleSignInDialog
          title={copy.joinLink.title}
          body={copy.login.body}
          onClose={() => setOpen(false)}
          onContinue={startGoogle}
        />
      ) : null}
    </>
  );
}

export function JoinLinkLanding({
  from,
  view,
  landing,
}: {
  from: string | null;
  view: JoinPageView;
  landing?: LandingView;
}) {
  const { copy } = useCopy();
  const [dismissedFullFor, setDismissedFullFor] = useState<string | null>(null);
  const fullNoticeOpen = view.status === "full" && dismissedFullFor !== from;
  const closedMessage =
    view.status === "full" ? copy.joinLink.full : copy.joinLink.unknown;
  const hero = view.status === "unknown"
    ? <p className="mx-auto mt-10 max-w-md text-sm text-eel/80">{closedMessage}</p>
    : undefined;
  const headerAction = view.showGoogle && from
    ? <JoinLoginButton from={from} />
    : null;

  return (
    <>
      <Home hero={hero} headerAction={headerAction} catchAuth={false} view={landing} inviteNote={Boolean(from)} joinDisabled={view.status === "full"} />
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
    </>
  );
}
