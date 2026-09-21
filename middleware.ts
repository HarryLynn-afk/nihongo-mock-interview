import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { pitchCallRedirectPath, PITCH_GATE_COOKIE } from "@/lib/content/pitchGate";
import { shouldRewriteAuthCallback } from "@/lib/content/studyAuth";
import { getPitchAccessKey } from "@/lib/server/env/pitchAccess";

export async function middleware(request: NextRequest) {
  // Next.js Edge only inlines env keys statically referenced here.
  void process.env.PITCH_ACCESS_KEY;
  const pitchRedirect = await pitchCallRedirectPath(
    request.nextUrl.pathname,
    request.nextUrl.search,
    request.cookies.get(PITCH_GATE_COOKIE)?.value,
    getPitchAccessKey(),
  );
  if (pitchRedirect) {
    const locked = request.nextUrl.clone();
    locked.pathname = pitchRedirect;
    locked.search = "";
    return NextResponse.redirect(locked);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const rewriteCallback = shouldRewriteAuthCallback(
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  const destination = request.nextUrl.clone();
  if (rewriteCallback) {
    destination.pathname = "/auth/continue";
  }

  if (!url || !anon) {
    return rewriteCallback
      ? NextResponse.rewrite(destination)
      : NextResponse.next();
  }

  let response = rewriteCallback
    ? NextResponse.rewrite(destination, { request })
    : NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = rewriteCallback
          ? NextResponse.rewrite(destination, { request })
          : NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/",
    "/call",
    "/pitch",
    "/login",
    "/join",
    "/consent",
    "/auth/callback",
    "/auth/continue",
    "/api/study/:path*",
  ],
};
