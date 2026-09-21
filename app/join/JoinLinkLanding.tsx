"use client";

import { useState } from "react";
import type { JoinPageView } from "@/lib/content/joinLink";
import { LanguageBar } from "../components/LanguageBar";
import { useCopy } from "../components/useUiLocale";

export function JoinLinkLanding({
  from,
  view,
}: {
  from: string | null;
  view: JoinPageView;
}) {
  const { copy } = useCopy();
  const [pending, setPending] = useState(false);
  const closedMessage =
    view.status === "full" ? copy.joinLink.full : copy.joinLink.unknown;

  async function startGoogle() {
    if (!from || pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/join-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from }),
      });
      const data = (await res.json()) as { url?: string | null };
      if (data.url) {
        window.location.assign(data.url);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <LanguageBar variant="light" />
      <main className="flex w-full max-w-md flex-col gap-6">
        <p className="text-lg font-bold tracking-tight">NihonGo</p>
        <h1 className="text-3xl font-semibold tracking-tight">{copy.joinLink.title}</h1>
        {view.showGoogle ? (
          <>
            <p className="text-sm text-ink/70">{copy.joinLink.body}</p>
            <button
              type="button"
              disabled={pending}
              onClick={() => void startGoogle()}
              className="rounded-full bg-indigo px-5 py-3 font-medium text-paper disabled:opacity-60"
            >
              {copy.joinLink.google}
            </button>
          </>
        ) : (
          <p className="text-sm text-ink/80">{closedMessage}</p>
        )}
        <p className="text-xs text-ink/50">{copy.joinLink.footer}</p>
      </main>
    </div>
  );
}
