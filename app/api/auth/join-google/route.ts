import { NextResponse } from "next/server";
import {
  JOIN_FROM_COOKIE,
  readJoinFrom,
  startJoinGoogle,
} from "@/lib/content/joinLink";
import { isSupabaseConfigured } from "@/lib/server/env/supabase";
import { createStudyAnonClient } from "@/lib/server/study/adminClients";
import { lookupJoinLink } from "@/lib/server/study/lookupJoinLink";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ url: null });
  }

  const body = (await request.json().catch(() => null)) as { from?: unknown } | null;
  const from =
    typeof body?.from === "string"
      ? readJoinFrom(`?from=${encodeURIComponent(body.from)}`)
      : null;
  const origin = new URL(request.url).origin;

  const result = await startJoinGoogle({
    from,
    origin,
    lookup: lookupJoinLink,
    createOAuthUrl: async (redirectTo) => {
      const anon = createStudyAnonClient();
      if (!anon) return null;
      const { data, error } = await anon.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return null;
      return data.url ?? null;
    },
  });

  const response = NextResponse.json({ url: result.url });
  if (result.url && from) {
    response.cookies.set(JOIN_FROM_COOKIE, from, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }
  return response;
}
