"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CONSENT_VERSION } from "@/lib/content/studyAuth";
import { fillTemplate } from "@/lib/content/uiCopy";
import { JoinInterview } from "../components/JoinInterview";
import { LanguageBar } from "../components/LanguageBar";
import { useCopy } from "../components/useUiLocale";

type TesterAccount = { displayName: string; email: string };

export default function ConsentPage() {
  const { push } = useRouter();
  const { copy } = useCopy();
  const [agreed, setAgreed] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [account, setAccount] = useState<TesterAccount | null>(null);
  const [entryState, setEntryState] = useState<"signInRequired" | "consentRequired" | "ready">(
    "consentRequired",
  );
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/study/me");
        const data = res?.ok
          ? ((await res.json()) as {
              participantId?: string | null;
              consented?: boolean;
              state?: "signInRequired" | "consentRequired" | "ready";
              account?: TesterAccount;
            })
          : null;
        if (!data || data.state === "signInRequired") {
          setEntryState("signInRequired");
          push("/login");
          return;
        }
        setAccount(data?.account ?? null);
        setParticipantId(data?.participantId ?? null);
        setEntryState(
          data?.state === "ready" || (!data?.state && data?.consented)
            ? "ready"
            : "consentRequired",
        );
      } catch {
        setEntryState("signInRequired");
        setError(copy.consent.errorSave);
      } finally {
        setReady(true);
      }
    })();
  }, [copy.consent.errorSave, push]);

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
      setEntryState("ready");
    } catch {
      setError(copy.consent.errorNotInvited);
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("sign out failed");
      const data = (await res.json()) as { destination?: string };
      const destination = data.destination;
      push(
        destination === "/login" || destination?.startsWith("/join?from=")
          ? destination
          : "/login",
      );
    } catch {
      setError(copy.account.signOutError);
      setSigningOut(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] text-eel">
      <header className="mx-auto flex w-full max-w-[1400px] items-center px-5 py-6 md:px-12">
        <Link href="/" className="font-display text-[1.5rem] font-bold tracking-tight text-feather">
          NihonGo<span aria-hidden="true" className="ml-0.5 inline-block -translate-y-2 text-base text-macaw">✦</span>
        </Link>
        <LanguageBar variant="light" className="ml-auto" />
      </header>
      <main className="mx-auto flex w-full max-w-[850px] flex-1 flex-col items-center px-5 pb-16 pt-12 text-center md:px-6 md:pt-20">
        <p className="text-sm font-semibold tracking-[0.12em] text-feather-dark">{copy.account.eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-extrabold leading-[1.08] tracking-[-0.02em]">
          {copy.account.title}
        </h1>
        <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-wolf">{copy.account.intro}</p>
        <section className="mt-10 w-full max-w-[620px] rounded-[28px] border border-eel/10 bg-white/95 p-6 text-left shadow-[0_20px_55px_-24px_rgba(28,71,46,0.25)] md:p-8">
          {account ? (
            <div aria-label={copy.account.label} className="flex flex-wrap items-start justify-between gap-4 border-b border-eel/10 pb-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-wolf">{copy.account.signedInWith}</p>
                <p className="mt-3 break-words text-xl font-semibold text-eel">{account.displayName}</p>
                <p className="mt-1 break-all text-sm text-wolf">{account.email}</p>
              </div>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                className="rounded-full border border-eel/15 px-5 py-3 text-sm font-medium text-eel transition-colors hover:bg-eel/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather disabled:opacity-60"
              >
                {copy.account.signOut}
              </button>
            </div>
          ) : null}
          <div className={account ? "pt-6" : ""}>
            <h2 className="text-2xl font-semibold tracking-tight text-eel">{copy.consent.title}</h2>
            {entryState === "ready" && participantId ? (
              <div className="mt-5 flex flex-col gap-5">
                <p className="text-sm leading-relaxed text-wolf">
                  {copy.consent.participantId} <strong className="text-eel">{participantId}</strong>.{" "}
                  {copy.consent.participantIdNote}
                </p>
                <JoinInterview tone="feather" />
              </div>
            ) : ready && entryState === "consentRequired" ? (
              <div className="mt-5 flex flex-col gap-5">
                <p className="text-sm leading-relaxed text-wolf">
                  {fillTemplate(copy.consent.body, { version: CONSENT_VERSION })}
                </p>
                <label className="flex items-start gap-3 text-left text-sm leading-relaxed text-eel">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-1 size-4 accent-feather"
                  />
                  {copy.consent.checkbox}
                </label>
                <button
                  type="button"
                  disabled={!agreed || pending}
                  onClick={() => void handleConsent()}
                  className="min-h-[52px] rounded-full bg-feather px-6 py-3 font-medium text-white transition-colors hover:bg-feather-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather disabled:opacity-60"
                >
                  {copy.consent.agree}
                </button>
                <button
                  type="button"
                  onClick={() => push("/")}
                  className="self-start text-sm font-medium text-feather-dark hover:underline"
                >
                  {copy.consent.guestInstead}
                </button>
              </div>
            ) : null}
            {error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}
