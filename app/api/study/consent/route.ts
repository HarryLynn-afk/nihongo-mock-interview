import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import {
  CONSENT_GATE_COOKIE,
  CONSENT_VERSION,
  consentGateIsOpen,
} from "@/lib/content/studyAuth";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import {
  createVisitConsentProof,
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

function consentResponse(participantId: string, proof: string) {
  const response = NextResponse.json({ participantId });
  response.cookies.set(VISIT_CONSENT_COOKIE, proof, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export async function POST() {
  const supabase = await createStudyServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const jar = await cookies();
  if (!consentGateIsOpen(jar.get(CONSENT_GATE_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const visitId = jar.get(VISIT_ID_COOKIE)?.value;
  const proof = visitId && await createVisitConsentProof(user.id, visitId);
  if (!proof) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const admin = createStudyAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const existing = await admin
    .from("participants")
    .select("participant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing.data?.participant_id) {
    return consentResponse(existing.data.participant_id, proof);
  }

  const email = user.email.toLowerCase();
  const from = readJoinFrom(
    `?from=${encodeURIComponent(
      jar.get(JOIN_FROM_COOKIE)?.value ?? "",
    )}`,
  );
  if (from) {
    const { data: enrollment, error: enrollmentError } = await admin.rpc(
      "enroll_join_participant",
      {
        google_user_id: user.id,
        google_email: email,
        invite_code: from,
        version: CONSENT_VERSION,
      },
    );
    if (enrollmentError) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    if (enrollment?.status !== "ok") {
      return NextResponse.json(
        { error: enrollment?.status === "full" ? "join_full" : "not_invited" },
        { status: 403 },
      );
    }
    if (typeof enrollment.participant_id !== "string") {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return consentResponse(enrollment.participant_id, proof);
  }

  const { data: enrollment, error } = await admin.rpc(
    "enroll_allowlisted_participant",
    { google_user_id: user.id, google_email: email, version: CONSENT_VERSION },
  );
  if (error) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (enrollment?.status === "not_invited") {
    return NextResponse.json({ error: "not_invited" }, { status: 403 });
  }
  if (enrollment?.status !== "ok" || typeof enrollment.participant_id !== "string") {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return consentResponse(enrollment.participant_id, proof);
}
