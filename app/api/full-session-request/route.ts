import { NextResponse } from "next/server";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { saveFullSessionRequest } from "./saveFullSessionRequest";

export async function POST(request: Request) {
  const admin = createStudyAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const email =
    body && typeof body === "object" && "email" in body
      ? (body as { email: unknown }).email
      : undefined;

  const outcome = await saveFullSessionRequest(email, async (normalized) => {
    const { error } = await admin
      .from("full_session_requests")
      .upsert({ email: normalized }, { onConflict: "email" });
    return { ok: !error };
  });

  if (outcome === "invalid") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (outcome === "unavailable") {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
