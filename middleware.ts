import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { JOIN_FROM_COOKIE, readJoinFrom } from "@/lib/content/joinLink";
import { consentGateCookie, shouldRewriteAuthCallback } from "@/lib/content/studyAuth";
import {
  CONSENT_GATE_COOKIE,
  mustSignIn,
  isParticipantCall,
  isRemovedPitchUrl,
} from "@/lib/content/visitPolicy";
import {
  hasVisitConsent,
  VISIT_CONSENT_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/server/study/visitConsent";

function forgetVisit(response: NextResponse) {
  const gate = consentGateCookie(false);
  response.cookies.set(gate.name, gate.value, gate.options);
}

function landingForVisit(request: NextRequest) {
  const from = readJoinFrom(`?from=${encodeURIComponent(request.cookies.get(JOIN_FROM_COOKIE)?.value ?? "")}`);
  const landing = request.nextUrl.clone();
  landing.pathname = from ? "/join" : "/";
  landing.search = from ? `?from=${encodeURIComponent(from)}` : "";
  return landing;
}

async function redirectToLoginAndSignOut(
  request: NextRequest,
  url: string | undefined,
  anon: string | undefined,
) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  const response = NextResponse.redirect(login);
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
  if (
    isRemovedPitchUrl(request.nextUrl.pathname, request.nextUrl.search)
  ) {
    const missing = request.nextUrl.clone();
    missing.pathname = "/pitch";
    missing.search = "";
    return NextResponse.rewrite(missing);
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
  if (
    isParticipantCall(pathname, search) &&
    (!request.cookies.get(VISIT_ID_COOKIE)?.value ||
      !request.cookies.get(VISIT_CONSENT_COOKIE)?.value)
  ) {
    return NextResponse.redirect(landingForVisit(request));
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (isParticipantCall(pathname, search)) {
    if (!user) {
      return redirectToLoginAndSignOut(request, url, anon);
    }
    if (
      !(await hasVisitConsent(
        user.id,
        request.cookies.get(VISIT_ID_COOKIE)?.value,
        request.cookies.get(VISIT_CONSENT_COOKIE)?.value,
      ))
    ) {
      return NextResponse.redirect(landingForVisit(request));
    }
    const { data: participant } = await supabase
      .from("participants")
      .select("participant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!participant?.participant_id) {
      return NextResponse.redirect(landingForVisit(request));
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    "/guest",
    "/call",
    "/login",
    "/join",
    "/consent",
    "/auth/callback",
    "/auth/continue",
    "/api/study/:path*",
  ],
};
