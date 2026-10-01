import { NextResponse } from "next/server";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";
import { consentGateCookie } from "@/lib/content/studyAuth";
import { sessionHome } from "@/lib/server/study/sessionHome";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import {
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

export async function POST() {
  // Read the destination before clearing anything: it depends on this
  // device's saved invite.
  const destination = await sessionHome();

  const supabase = await createStudyServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
  }

  const response = NextResponse.json({ ok: true, destination });
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
