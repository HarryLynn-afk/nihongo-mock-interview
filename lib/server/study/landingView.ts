import { cookies } from "next/headers";
import type { LandingView, LandingSession } from "@/lib/content/landingView";
import { JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import { CONSENT_GATE_COOKIE, consentGateIsOpen } from "@/lib/content/studyAuth";
import { createStudyServerClient } from "./serverClient";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "./visitConsent";

export async function getLandingView(origin: string): Promise<LandingView> {
  return { origin, invite: "none", from: null, session: await sessionFor(origin) };
}

async function sessionFor(origin: string): Promise<LandingSession> {
  const jar = await cookies();
  if (!consentGateIsOpen(jar.get(CONSENT_GATE_COOKIE)?.value)) {
    return { kind: "signedOut" };
  }
  const expectedFrom = origin.startsWith("/join?")
    ? readJoinFrom(origin.slice("/join".length))
    : null;
  const activeFrom = readJoinFrom(`?from=${encodeURIComponent(jar.get(JOIN_FROM_COOKIE)?.value ?? "")}`);
  if (expectedFrom !== activeFrom) return { kind: "signedOut" };

  const supabase = await createStudyServerClient();
  if (!supabase) return { kind: "signedOut" };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: "signedOut" };

  const consentedThisVisit = await hasVisitConsent(
    user.id,
    jar.get(VISIT_ID_COOKIE)?.value,
    jar.get(VISIT_CONSENT_COOKIE)?.value,
  );
  return { kind: "signedIn", consentedThisVisit };
}
