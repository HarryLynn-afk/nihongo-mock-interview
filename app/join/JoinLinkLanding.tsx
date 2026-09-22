"use client";

import { useState } from "react";
import type { JoinPageView } from "@/lib/content/joinLink";
import { GoogleSignInDialog } from "../components/GoogleSignInDialog";
import Home from "../page";
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
}: {
  from: string | null;
  view: JoinPageView;
}) {
  const { copy } = useCopy();
  const closedMessage =
    view.status === "full" ? copy.joinLink.full : copy.joinLink.unknown;
  const hero =
    view.showGoogle && from ? (
      <div className="mt-10 hidden justify-center md:flex">
        <JoinLoginButton from={from} />
      </div>
    ) : (
      <p className="mx-auto mt-10 max-w-md text-sm text-eel/80">{closedMessage}</p>
    );

  return <Home hero={hero} headerAction={null} catchAuth={false} />;
}
