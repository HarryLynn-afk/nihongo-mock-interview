import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createStudyServerClient } from "@/lib/server/study/serverClient";

const OTP_TYPES = new Set<EmailOtpType>([
  "invite",
  "magiclink",
  "email",
  "signup",
  "recovery",
  "email_change",
]);

function isOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && OTP_TYPES.has(value as EmailOtpType));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = await createStudyServerClient();

  if (supabase && code) {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL("/consent", origin));
  }

  if (supabase && tokenHash && isOtpType(type)) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return NextResponse.redirect(new URL("/consent", origin));
  }

  // Hash tokens live in the URL fragment, which this server route never
  // receives. Middleware rewrites this request to /auth/continue without
  // changing the browser URL, so HashSessionCatcher can still read #access_token.
  return NextResponse.redirect(new URL("/auth/continue", origin));
}