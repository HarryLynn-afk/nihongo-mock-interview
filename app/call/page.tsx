import { sessionHome } from "@/lib/server/study/sessionHome";
import { cookies } from "next/headers";
import { createStudyAttemptToken } from "@/lib/server/study/scoreAttempt";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { hasVisitConsent, VISIT_CONSENT_COOKIE, VISIT_ID_COOKIE } from "@/lib/server/study/visitConsent";
import { CallScreen } from "./CallScreen";

/**
 * Resolves where this session goes home (its invite link while open, else `/`)
 * and hands it to the classroom so the report's Back to home agrees with sign-out.
 */
export default async function CallPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const homeHref = await sessionHome();
  let attemptToken: string | undefined;
  if ((await searchParams).guest !== "1") {
    const supabase = await createStudyServerClient();
    const user = supabase && (await supabase.auth.getUser()).data.user;
    const jar = await cookies();
    if (!user || !(await hasVisitConsent(
      user.id,
      jar.get(VISIT_ID_COOKIE)?.value,
      jar.get(VISIT_CONSENT_COOKIE)?.value,
    ))) throw new Error("Participant visit unavailable");
    attemptToken = await createStudyAttemptToken(user.id, crypto.randomUUID()) ?? undefined;
    if (!attemptToken) throw new Error("Study attempt unavailable");
  }
  return <CallScreen homeHref={homeHref} attemptToken={attemptToken} />;
}
