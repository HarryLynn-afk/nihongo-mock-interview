import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import {
  hasVisitConsent,
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

export async function GET() {
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ state: "signInRequired", participantId: null, consented: false });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ state: "signInRequired", participantId: null, consented: false });
  }
  const { data } = await supabase
    .from("participants")
    .select("participant_id, consent_at")
    .eq("id", user.id)
    .maybeSingle();
  const jar = await cookies();
  const ready = Boolean(data?.participant_id) &&
    await hasVisitConsent(
      user.id,
      jar.get(VISIT_ID_COOKIE)?.value,
      jar.get(VISIT_CONSENT_COOKIE)?.value,
    );
  const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return NextResponse.json({
    state: ready ? "ready" : "consentRequired",
    account: {
      displayName:
        typeof googleName === "string" && googleName.trim()
          ? googleName.trim()
          : (user.email ?? "Tester"),
      email: user.email ?? "",
    },
    participantId: data?.participant_id ?? null,
    consented: Boolean(data?.consent_at),
  });
}
