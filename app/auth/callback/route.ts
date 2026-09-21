import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
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

function redirectWithJoinFrom(url: URL, from: string | null) {
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
  return response;
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
    return redirectWithJoinFrom(new URL("/consent", origin), from);
  }

  if (supabase && tokenHash && isOtpType(type)) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return redirectWithJoinFrom(new URL("/consent", origin), from);
  }

  // Hash tokens live in the URL fragment, which this server route never
  // receives. Middleware rewrites this request to /auth/continue without
  // changing the browser URL, so HashSessionCatcher can still read #access_token.
  return redirectWithJoinFrom(new URL("/auth/continue", origin), from);
}
