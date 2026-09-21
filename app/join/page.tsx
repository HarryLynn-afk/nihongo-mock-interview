import type { Metadata } from "next";
import { joinPageView, readJoinFrom } from "@/lib/content/joinLink";
import { lookupJoinLink } from "@/lib/server/study/lookupJoinLink";
import { JoinLinkLanding } from "./JoinLinkLanding";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Capped tester join-link. Not linked from `/`. Testers share
 * `/join?from=CODE`; Google sign-up becomes a Participant after consent.
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
  return <JoinLinkLanding from={from} view={joinPageView(from, link)} />;
}
