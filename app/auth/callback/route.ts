import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { JOIN_FROM_COOKIE, DEVICE_INVITE_COOKIE, DEVICE_INVITE_MAX_AGE_SECONDS, readJoinFrom } from "@/lib/content/joinLink";
import {
  allowlistedLoginGate,
  consentGateCookie,
  normalizeEmail,
} from "@/lib/content/studyAuth";
import { nextAfterAuth } from "@/lib/content/visitPolicy";
import { createStudyAdminClient } from "@/lib/server/study/adminClients";
import { createStudyServerClient } from "@/lib/server/study/serverClient";
import { randomUUID } from "node:crypto";
import { requestOrigin } from "@/lib/server/security/requestOrigin";
import {
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

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
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  response.cookies.set(VISIT_ID_COOKIE, open ? randomUUID() : "", {
    ...options,
    ...(open ? {} : { maxAge: 0 }),
  });
  response.cookies.set(VISIT_CONSENT_COOKIE, "", { ...options, maxAge: 0 });
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
    // Remember this device's invite past sign-out so the next tester can join.
    response.cookies.set(DEVICE_INVITE_COOKIE, from, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DEVICE_INVITE_MAX_AGE_SECONDS,
    });
  }
  if (openConsentGate) {
    applyConsentGate(response, true);
  }
  return response;
}

function redirectAuthFailed(origin: string, from: string | null) {
  const path = nextAfterAuth({ from, ok: false });
  const response = NextResponse.redirect(new URL(path, origin));
  applyConsentGate(response, false);
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
  const { searchParams } = new URL(request.url);
  const origin = requestOrigin(request);
  const from = readJoinFrom(
    `?from=${encodeURIComponent(searchParams.get("from") ?? "")}`,
  );
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = await createStudyServerClient();

  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      await supabase.auth.signOut();
      return redirectAuthFailed(origin, from);
    }
    const gate = await gateSession(from);
    if (gate.reject) {
      await supabase.auth.signOut();
      return redirectLoginNotInvited(origin);
    }
    return redirectWithJoinFrom(
      new URL(from ? `/join?from=${encodeURIComponent(from)}` : "/", origin),
      from,
      true,
    );
  }

  if (supabase && tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      await supabase.auth.signOut();
      return redirectAuthFailed(origin, from);
    }
    const gate = await gateSession(from);
    if (gate.reject) {
      await supabase.auth.signOut();
      return redirectLoginNotInvited(origin);
    }
    return redirectWithJoinFrom(
      new URL(from ? `/join?from=${encodeURIComponent(from)}` : "/", origin),
      from,
      true,
    );
  }

  // Hash tokens live in the URL fragment, which this server route never
  // receives. Middleware rewrites this request to /auth/continue without
  // changing the browser URL, so HashSessionCatcher can still read #access_token.
  return redirectWithJoinFrom(new URL("/auth/continue", origin), from, false);
}
