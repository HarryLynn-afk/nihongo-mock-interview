import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { consentGateCookie } from "@/lib/content/studyAuth";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import {
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

export async function POST() {
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  const gate = consentGateCookie(true);
  response.cookies.set(gate.name, gate.value, gate.options);
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  response.cookies.set(VISIT_ID_COOKIE, randomUUID(), options);
  response.cookies.set(VISIT_CONSENT_COOKIE, "", { ...options, maxAge: 0 });
  return response;
}
