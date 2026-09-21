"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/content/studyAuth";
import { fillTemplate } from "@/lib/content/uiCopy";
import { JoinInterview } from "../components/JoinInterview";
import { LanguageBar } from "../components/LanguageBar";
import { useCopy } from "../components/useUiLocale";

const SHOW_DEBUG_WHOAMI = process.env.NODE_ENV !== "production";

export default function ConsentPage() {
  const router = useRouter();
  const { copy } = useCopy();
  const [agreed, setAgreed] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [debugEmail, setDebugEmail] = useState<string | null | "loading">(
    SHOW_DEBUG_WHOAMI ? "loading" : null,
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/study/me");
        const data = res?.ok
          ? ((await res.json()) as {
              participantId?: string | null;
              consented?: boolean;
            })
          : null;
        if (data?.consented && data.participantId) {
          setParticipantId(data.participantId);
        }
      } catch {
        // Fresh visit: keep the checkbox until Agree.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!SHOW_DEBUG_WHOAMI) return;
    void (async () => {
      try {
        const res = await fetch("/api/study/debug-whoami");
        const data = res?.ok
          ? ((await res.json()) as { email?: string | null })
          : null;
        setDebugEmail(data?.email ?? null);
      } catch {
        setDebugEmail(null);
      }
    })();
  }, []);

  async function handleConsent() {
    if (!agreed || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/study/consent", { method: "POST" });
      const data = (await res.json()) as { participantId?: string; error?: string };
      if (!res.ok || !data.participantId) {
        if (res.status === 401) {
          setError(copy.consent.errorSignedOut);
        } else if (data.error === "join_full") {
          setError(copy.joinLink.full);
        } else if (data.error === "not_invited" || res.status === 403) {
          setError(copy.consent.errorNotInvited);
        } else {
          setError(copy.consent.errorSave);
        }
        return;
      }
      setParticipantId(data.participantId);
    } catch {
      setError(copy.consent.errorNotInvited);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <LanguageBar variant="light" />
      <main className="flex w-full max-w-md flex-col gap-6">
        {SHOW_DEBUG_WHOAMI ? (
          <p className="text-xs text-ink/40">
            Dev only — signed in as:{" "}
            {debugEmail === "loading"
              ? "checking…"
              : (debugEmail ?? "not signed in")}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight">{copy.consent.title}</h1>
        {participantId ? (
          <>
            <p className="text-sm text-ink/70">
              {copy.consent.participantId} <strong>{participantId}</strong>.{" "}
              {copy.consent.participantIdNote}
            </p>
            <JoinInterview />
          </>
        ) : ready ? (
          <>
            <p className="text-sm text-ink/70">
              {fillTemplate(copy.consent.body, { version: CONSENT_VERSION })}
            </p>
            <label className="flex items-start gap-3 text-left text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-1"
              />
              {copy.consent.checkbox}
            </label>
            <button
              type="button"
              disabled={!agreed || pending}
              onClick={() => void handleConsent()}
              className="rounded-full bg-indigo px-5 py-3 font-medium text-paper disabled:opacity-60"
            >
              {copy.consent.agree}
            </button>
            {error ? <p className="text-sm text-ink/80">{error}</p> : null}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm font-medium text-indigo"
            >
              {copy.consent.guestInstead}
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}
