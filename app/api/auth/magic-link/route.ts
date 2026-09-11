import { NextResponse } from "next/server";
import {
  isPlausibleEmail,
  MAGIC_LINK_COPY,
  maybeSendMagicLink,
  normalizeEmail,
} from "@/lib/content/studyAuth";
import { isSupabaseConfigured } from "@/lib/server/env/supabase";
import {
  createStudyAdminClient,
  createStudyAnonClient,
} from "@/lib/server/study/adminClients";

async function emailIsAllowlisted(email: string): Promise<boolean> {
  const admin = createStudyAdminClient();
  if (!admin) return false;
  const { data, error } = await admin
    .from("invited_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    console.error("invited_emails lookup failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email =
    typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  if (!isPlausibleEmail(email)) {
    return NextResponse.json({ message: MAGIC_LINK_COPY });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: MAGIC_LINK_COPY });
  }

  const origin = new URL(request.url).origin;
  const allowlisted = await emailIsAllowlisted(email);
  if (!allowlisted) {
    console.info("magic-link: send skipped, email not in invited_emails");
  }
  const result = await maybeSendMagicLink({
    email,
    allowlisted,
    send: async (listedEmail) => {
      const anon = createStudyAnonClient();
      if (!anon) {
        console.error("magic-link OTP failed: anon client missing");
        return;
      }
      const { error } = await anon.auth.signInWithOtp({
        email: listedEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (error) {
        console.error("magic-link OTP failed:", error.message);
      }
    },
  });

  return NextResponse.json(result);
}
