"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { readJoinFrom } from "@/lib/content/joinLink";
import { LanguageToggle } from "../components/LanguageToggle";
import { useCopy } from "../components/useUiLocale";

type Profile = {
  state: "signInRequired" | "consentRequired" | "ready";
  account?: { displayName: string; email: string };
  participantId?: string | null;
};

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedReturn = searchParams.get("returnTo");
  const from = requestedReturn?.startsWith("/join?")
    ? readJoinFrom(requestedReturn.slice("/join".length))
    : null;
  const returnTo = from && requestedReturn === `/join?from=${encodeURIComponent(from)}`
    ? requestedReturn
    : "/";
  const { locale, setLocale, copy } = useCopy();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signOutError, setSignOutError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/study/me")
      .then((response) => response.json() as Promise<Profile>)
      .then((result) => {
        if (!active) return;
        if (result.state === "signInRequired") router.push("/");
        else setProfile(result);
      });
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    setSignOutError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("sign out failed");
      const result = (await response.json()) as { destination: string };
      router.push(result.destination);
    } catch {
      setSignOutError(true);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e8f8d4_0%,#f4fbef_48%,#ffffff_100%)] text-eel">
      <header className="mx-auto flex w-full max-w-[1100px] items-center gap-5 px-5 py-6 md:px-8">
        <Link href="/" className="font-display text-[1.5rem] font-bold tracking-tight text-feather">NihonGo<span aria-hidden="true" className="ml-0.5 inline-block -translate-y-2 text-base text-macaw">✦</span></Link>
        <div className="ml-auto"><LanguageToggle locale={locale} onChange={setLocale} /></div>
      </header>
      <main className="mx-auto w-full max-w-[680px] px-5 pb-20 pt-10 md:pt-20">
        <Link href={returnTo} className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-feather px-5 text-sm font-medium text-white shadow-[0_4px_7px_rgba(88,204,2,0.12)] transition-colors hover:bg-feather-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather">← {copy.account.back}</Link>
        <h1 className="mt-7 font-display text-4xl font-bold tracking-tight">{copy.account.profile}</h1>
        {profile?.account ? (
          <section className="mt-8 rounded-[24px] border border-eel/10 bg-white p-6 shadow-[0_16px_45px_-25px_rgba(28,71,46,0.25)] sm:p-8" aria-label={copy.account.label}>
            <div className="flex items-center gap-4 border-b border-eel/10 pb-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#d8f5b0] text-xl font-semibold text-feather-dark" aria-hidden="true">{profile.account.displayName.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0"><p className="truncate text-xl font-semibold">{profile.account.displayName}</p><p className="mt-1 break-all text-sm text-wolf">{profile.account.email}</p></div>
            </div>
            {profile.participantId ? <div className="border-b border-eel/10 py-6"><p className="text-sm text-wolf">{copy.consent.participantId}</p><p className="mt-1 font-semibold">{profile.participantId}</p></div> : null}
            <div className="pt-6"><p className="text-sm text-wolf">{copy.account.signedInWith}</p><button type="button" onClick={() => void signOut()} className="mt-4 min-h-11 rounded-full border border-red-300 px-5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">{copy.account.signOut}</button>{signOutError ? <p role="alert" className="mt-3 text-sm text-red-700">{copy.account.signOutError}</p> : null}</div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return <Suspense fallback={null}><ProfileContent /></Suspense>;
}
