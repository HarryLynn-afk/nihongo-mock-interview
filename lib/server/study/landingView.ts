import { cookies } from "next/headers";
import type { LandingView, LandingSession } from "@/lib/content/landingView";
import { DEVICE_INVITE_COOKIE, JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import { CONSENT_GATE_COOKIE, consentGateIsOpen } from "@/lib/content/studyAuth";
import { createStudyServerClient } from "./serverClient";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "./visitConsent";
import { traceInterviewReturn } from "./traceInterviewReturn";

export async function getLandingView(origin: string): Promise<LandingView> {
  return { origin, invite: "none", from: null, session: await sessionFor(origin) };
}

async function sessionFor(origin: string): Promise<LandingSession> {
  const jar = await cookies();
  function finish(session: LandingSession, reason: Parameters<typeof traceInterviewReturn>[0]["reason"]) {
    traceInterviewReturn({
      stage: "landing",
      destination: origin,
      hasLoginInvite: Boolean(jar.get(JOIN_FROM_COOKIE)?.value),
      hasDeviceInvite: Boolean(jar.get(DEVICE_INVITE_COOKIE)?.value),
      session: session.kind,
      reason,
    });
    return session;
  }
  if (!consentGateIsOpen(jar.get(CONSENT_GATE_COOKIE)?.value)) {
    return finish({ kind: "signedOut" }, "visit-closed");
  }
  const expectedFrom = origin.startsWith("/join?")
    ? readJoinFrom(origin.slice("/join".length))
    : null;
  const activeFrom = readJoinFrom(`?from=${encodeURIComponent(jar.get(JOIN_FROM_COOKIE)?.value ?? "")}`);
  if (expectedFrom !== activeFrom) return finish({ kind: "signedOut" }, "invite-mismatch");

  const supabase = await createStudyServerClient();
  if (!supabase) return finish({ kind: "signedOut" }, "auth-unconfigured");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return finish({ kind: "signedOut" }, "no-user");

  const consentedThisVisit = await hasVisitConsent(
    user.id,
    jar.get(VISIT_ID_COOKIE)?.value,
    jar.get(VISIT_CONSENT_COOKIE)?.value,
  );
  return finish({ kind: "signedIn", consentedThisVisit }, "authenticated");
}
