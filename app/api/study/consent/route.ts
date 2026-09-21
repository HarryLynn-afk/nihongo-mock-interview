import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  applyJoinClaim,
  JOIN_FROM_COOKIE,
  readJoinFrom,
} from "@/lib/content/joinLink";
import {
  CONSENT_GATE_COOKIE,
  CONSENT_VERSION,
  consentGateIsOpen,
  nextParticipantId,
} from "@/lib/content/studyAuth";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import {
  addInvitedEmail,
  consumeInviteSlot,
  lookupJoinLink,
} from "@/lib/server/study/lookupJoinLink";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

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
    return NextResponse.json({ participantId: existing.data.participant_id });
  }

  const email = user.email.toLowerCase();
  const from = readJoinFrom(
    `?from=${encodeURIComponent(
      jar.get(JOIN_FROM_COOKIE)?.value ?? "",
    )}`,
  );
  if (from) {
    const claim = await applyJoinClaim({
      from,
      email,
      alreadyParticipant: false,
      lookup: lookupJoinLink,
      addToWaitlist: addInvitedEmail,
      consumeSlot: consumeInviteSlot,
    });
    if (!claim.ok) {
      return NextResponse.json(
        { error: claim.status === "full" ? "join_full" : "not_invited" },
        { status: 403 },
      );
    }
  }

  const listed = await admin
    .from("invited_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (!listed.data) {
    return NextResponse.json({ error: "not_invited" }, { status: 403 });
  }

  const { data: rows } = await admin.from("participants").select("participant_id");
  const participantId = nextParticipantId(
    (rows ?? []).map((row) => row.participant_id as string),
  );

  const { error } = await admin.from("participants").insert({
    id: user.id,
    email,
    participant_id: participantId,
    consent_version: CONSENT_VERSION,
    consent_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return NextResponse.json({ participantId });
}
