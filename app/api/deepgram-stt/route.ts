import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { hasVisitConsent, VISIT_ID_COOKIE, VISIT_CONSENT_COOKIE } from "@/lib/server/study/visitConsent";
import { getDeepgramSttKey } from "@/lib/server/env/deepgramStt";
import { withApiGuard } from "@/lib/server/security/guard";
import { mintDeepgramListenToken } from "./mintListenToken";

export const POST = withApiGuard(async () => {
  const apiKey = getDeepgramSttKey();
  if (!apiKey) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const supabase = await createStudyServerClient();
  const user = supabase && (await supabase.auth.getUser()).data.user;
  const jar = await cookies();
  if (!user || !(await hasVisitConsent(user.id,
    jar.get(VISIT_ID_COOKIE)?.value, jar.get(VISIT_CONSENT_COOKIE)?.value))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const participant = await supabase!.from("participants")
    .select("participant_id").eq("id", user.id).maybeSingle();
  if (participant.error) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (!participant.data?.participant_id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const minted = await mintDeepgramListenToken({
    apiKey,
    fetchImpl: fetch,
  });
  if (!minted) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ accessToken: minted.accessToken });
}, "expensive");
