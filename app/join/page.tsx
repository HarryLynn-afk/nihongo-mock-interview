import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { joinPageView, readJoinFrom } from "@/lib/content/joinLink";
import { lookupJoinLink } from "@/lib/server/study/lookupJoinLink";
import { getLandingView } from "@/lib/server/study/landingView";
import Home from "../components/Home";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Capped tester join-link. Not linked from `/`. Testers share
 * `/join?from=CODE`; Google sign-up becomes a Participant after consent.
 * Renders the same landing module as `/`, differing only by invite status.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.from) ? params.from[0] : params.from;
  const from = readJoinFrom(`?from=${encodeURIComponent(raw ?? "")}`);
  const link = from ? await lookupJoinLink(from) : null;
  if (!from || !link) {
    notFound();
  }
  const base = await getLandingView(`/join?from=${encodeURIComponent(from)}`);
  return <Home view={{ ...base, invite: joinPageView(from, link).status, from }} />;
}
