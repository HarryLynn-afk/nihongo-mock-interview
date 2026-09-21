import { NextResponse } from "next/server";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";
import { startLoginGoogle } from "@/lib/content/studyAuth";
import { isSupabaseConfigured } from "@/lib/server/env/supabase";
import { createStudyAnonClient } from "@/lib/server/study/adminClients";

function clearJoinCookie(response: NextResponse) {
  response.cookies.set(JOIN_FROM_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.json({
    url: isSupabaseConfigured()
      ? (
          await startLoginGoogle({
            origin,
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
          })
        ).url
      : null,
  });
  clearJoinCookie(response);
  return response;
}
