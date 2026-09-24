import { cookies } from "next/headers";
import type { LandingView } from "@/lib/content/landingView";
import { JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import { CONSENT_GATE_COOKIE, consentGateIsOpen } from "@/lib/content/studyAuth";
import { createStudyServerClient } from "./serverClient";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "./visitConsent";

export async function getLandingView(origin: string): Promise<LandingView> {
  const jar = await cookies();
  if (!consentGateIsOpen(jar.get(CONSENT_GATE_COOKIE)?.value)) {
    return { kind: "signedOut", origin };
  }
  const expectedFrom = origin.startsWith("/join?")
    ? readJoinFrom(origin.slice("/join".length))
    : null;
  const activeFrom = readJoinFrom(`?from=${encodeURIComponent(jar.get(JOIN_FROM_COOKIE)?.value ?? "")}`);
  if (expectedFrom !== activeFrom) return { kind: "signedOut", origin };

  const supabase = await createStudyServerClient();
  if (!supabase) return { kind: "signedOut", origin };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: "signedOut", origin };

  const consentedThisVisit = await hasVisitConsent(
    user.id,
    jar.get(VISIT_ID_COOKIE)?.value,
    jar.get(VISIT_CONSENT_COOKIE)?.value,
  );
  return { kind: "signedIn", origin, consentedThisVisit };
}
