import { sessionHome } from "@/lib/server/study/sessionHome";
import { DEVICE_INVITE_COOKIE, JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import { traceInterviewReturn } from "@/lib/server/study/traceInterviewReturn";
import { cookies } from "next/headers";
import { createStudyAttemptToken } from "@/lib/server/study/scoreAttempt";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "@/lib/server/study/visitConsent";
import { CallScreen } from "./CallScreen";

/**
 * Participants return to their current login landing; guests use the device invite.
 */
export default async function CallPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const guest = (await searchParams).guest === "1";
  let homeHref = guest ? await sessionHome() : "/";
  let attemptToken: string | undefined;
  if (!guest) {
    const supabase = await createStudyServerClient();
    const user = supabase && (await supabase.auth.getUser()).data.user;
    const jar = await cookies();
    const from = readJoinFrom(`?from=${encodeURIComponent(jar.get(JOIN_FROM_COOKIE)?.value ?? "")}`);
    homeHref = from ? `/join?from=${encodeURIComponent(from)}` : "/";
    if (!user || !(await hasVisitConsent(
      user.id,
      jar.get(VISIT_ID_COOKIE)?.value,
      jar.get(VISIT_CONSENT_COOKIE)?.value,
    ))) throw new Error("Participant visit unavailable");
    attemptToken = await createStudyAttemptToken(user.id, crypto.randomUUID()) ?? undefined;
    if (!attemptToken) throw new Error("Study attempt unavailable");
    traceInterviewReturn({
      stage: "classroom",
      destination: homeHref,
      hasLoginInvite: Boolean(from),
      hasDeviceInvite: Boolean(jar.get(DEVICE_INVITE_COOKIE)?.value),
    });
  }
  return <CallScreen homeHref={homeHref} attemptToken={attemptToken} />;
}
