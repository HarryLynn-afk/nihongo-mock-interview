import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import {
  allowlistedLoginGate,
  consentGateCookie,
  normalizeEmail,
} from "@/lib/content/studyAuth";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

const OTP_TYPES = new Set<EmailOtpType>([
  "invite",
  "magiclink",
  "email",
  "signup",
  "recovery",
  "email_change",
]);

const JOIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function isOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && OTP_TYPES.has(value as EmailOtpType));
}

function applyConsentGate(response: NextResponse, open: boolean) {
  const gate = consentGateCookie(open);
  response.cookies.set(gate.name, gate.value, gate.options);
}

function redirectWithJoinFrom(
  url: URL,
  from: string | null,
  openConsentGate: boolean,
) {
  const response = NextResponse.redirect(url);
  if (from) {
    response.cookies.set(JOIN_FROM_COOKIE, from, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: JOIN_COOKIE_MAX_AGE_SECONDS,
    });
  }
  if (openConsentGate) {
    applyConsentGate(response, true);
  }
  return response;
}

function redirectLoginNotInvited(origin: string) {
  const login = new URL("/login", origin);
  login.searchParams.set("error", "not_invited");
  const response = NextResponse.redirect(login);
  response.cookies.set(JOIN_FROM_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  applyConsentGate(response, false);
  return response;
}

async function gateSession(from: string | null) {
  const admin = createStudyAdminClient();
  const supabase = await createStudyServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let alreadyParticipant = false;
  let allowlisted = false;
  if (admin && user?.id) {
    const existing = await admin
      .from("participants")
      .select("participant_id")
      .eq("id", user.id)
      .maybeSingle();
    alreadyParticipant = Boolean(existing.data?.participant_id);
  }
  if (admin && user?.email) {
    const listed = await admin
      .from("invited_emails")
      .select("email")
      .eq("email", normalizeEmail(user.email))
      .maybeSingle();
    allowlisted = Boolean(listed.data);
  }

  return allowlistedLoginGate({ from, alreadyParticipant, allowlisted });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const from = readJoinFrom(
    `?from=${encodeURIComponent(searchParams.get("from") ?? "")}`,
  );
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = await createStudyServerClient();

  if (supabase && code) {
    await supabase.auth.exchangeCodeForSession(code);
    const gate = await gateSession(from);
    if (gate.reject) {
      await supabase.auth.signOut();
      return redirectLoginNotInvited(origin);
    }
    return redirectWithJoinFrom(new URL("/consent", origin), from, true);
  }

  if (supabase && tokenHash && isOtpType(type)) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    const gate = await gateSession(from);
    if (gate.reject) {
      await supabase.auth.signOut();
      return redirectLoginNotInvited(origin);
    }
    return redirectWithJoinFrom(new URL("/consent", origin), from, true);
  }

  // Hash tokens live in the URL fragment, which this server route never
  // receives. Middleware rewrites this request to /auth/continue without
  // changing the browser URL, so HashSessionCatcher can still read #access_token.
  return redirectWithJoinFrom(new URL("/auth/continue", origin), from, false);
}
