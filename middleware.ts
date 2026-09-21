import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { pitchCallRedirectPath, PITCH_GATE_COOKIE } from "@/lib/content/pitchGate";
import { consentGateCookie, shouldRewriteAuthCallback } from "@/lib/content/studyAuth";
import {
  CONSENT_GATE_COOKIE,
  mustSignIn,
} from "@/lib/content/visitPolicy";
import { getPitchAccessKey } from "@/lib/server/env/pitchAccess";

function forgetVisit(response: NextResponse) {
  const gate = consentGateCookie(false);
  response.cookies.set(gate.name, gate.value, gate.options);
}

async function redirectToLoginAndSignOut(
  request: NextRequest,
  url: string | undefined,
  anon: string | undefined,
) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  let response = NextResponse.redirect(login);
  forgetVisit(response);
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    await supabase.auth.signOut();
  }
  return response;
}

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

  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const visitCookie = request.cookies.get(CONSENT_GATE_COOKIE)?.value;

  // Visit cookie is required for /consent and Participant /call.
  // / does not clear it — only /login and /join replace a visit via OAuth sign-out.
  if (mustSignIn(pathname, search, visitCookie)) {
    return redirectToLoginAndSignOut(request, url, anon);
  }

  const rewriteCallback = shouldRewriteAuthCallback(pathname, search);
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
