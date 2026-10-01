import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEVICE_INVITE_COOKIE, JOIN_FROM_COOKIE } from "@/lib/content/joinLink";
import { consentGateCookie } from "@/lib/content/studyAuth";
import { signOutDestination } from "@/lib/content/visitPolicy";
import { lookupJoinLink } from "@/lib/server/study/lookupJoinLink";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import {
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

export async function POST() {
  const jar = await cookies();
  // This device's sign-up invite decides where sign-out lands. It is kept so
  // the next tester can still sign up from the same link.
  const inviteCode = jar.get(DEVICE_INVITE_COOKIE)?.value ?? null;
  const link = inviteCode ? await lookupJoinLink(inviteCode) : null;

  const supabase = await createStudyServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
  }

  const response = NextResponse.json({
    ok: true,
    destination: signOutDestination(inviteCode, link),
  });
  const gate = consentGateCookie(false);
  response.cookies.set(gate.name, gate.value, gate.options);
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  for (const name of [JOIN_FROM_COOKIE, VISIT_ID_COOKIE, VISIT_CONSENT_COOKIE]) {
    response.cookies.set(name, "", options);
  }
  return response;
}
