/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { DEVICE_INVITE_COOKIE, JOIN_FROM_COOKIE } from "@/lib/content/joinLink";

const state = vi.hoisted(() => ({
  cookies: {} as Record<string, string>,
  signedIn: false,
  callback: "",
  signOut: vi.fn(),
}));

// Substitute only framework request context and external Supabase services.
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => state.cookies[name] ? { name, value: state.cookies[name] } : undefined,
    getAll: () => Object.entries(state.cookies).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => { state.cookies[name] = value; },
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.signedIn ? { id: "user-1", email: "tester@example.com" } : null } }),
      signOut: state.signOut,
      signInWithOAuth: async ({ options }: { options: { redirectTo: string } }) => {
        state.callback = options.redirectTo;
        return { data: { url: "https://accounts.google.com/test-only" }, error: null };
      },
      exchangeCodeForSession: async () => { state.signedIn = true; return { error: null }; },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { participant_id: "P001" }, error: null }) }) }) }),
  }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
      data: table === "invite_links" ? { signup_count: 1, max_signups: 10 }
        : table === "participants" ? { participant_id: "P001" } : { email: "tester@example.com" },
      error: null,
    }) }) }) }),
  }),
}));

import { middleware } from "@/middleware";
import { POST as normalLogin } from "@/app/api/auth/login-google/route";
import { POST as inviteLogin } from "@/app/api/auth/join-google/route";
import { GET as callback } from "@/app/auth/callback/route";
import { POST as consent } from "@/app/api/study/consent/route";
import { GET as auth } from "@/app/api/study/auth/route";
import { getLandingView } from "@/lib/server/study/landingView";
import { sessionHome } from "@/lib/server/study/sessionHome";
import { __resetGuard } from "@/lib/server/security/guard";
import CallPage from "./page";
import LandingPage from "@/app/page";
import JoinPage from "@/app/join/page";

function applyCookies(response: Response) {
  expect(response).toBeInstanceOf(NextResponse);
  for (const cookie of (response as NextResponse).cookies.getAll()) {
    if (cookie.maxAge === 0) delete state.cookies[cookie.name];
    else state.cookies[cookie.name] = cookie.value;
  }
}

async function navigate(path: string) {
  const request = new NextRequest(`http://localhost:3000${path}`);
  for (const [name, value] of Object.entries(state.cookies)) request.cookies.set(name, value);
  const response = await middleware(request);
  applyCookies(response);
  expect(response.headers.get("location")).toBeNull();
}

async function login(kind: "normal" | "invite") {
  // Merely opening an invite leaves a long-lived device cookie.
  await navigate("/join?from=rsu-k7m2");
  state.cookies[JOIN_FROM_COOKIE] = "rsu-k7m2";
  state.signedIn = true;
  const response = kind === "normal"
    ? await normalLogin(new Request("http://localhost:3000/api/auth/login-google", { method: "POST" }))
    : await inviteLogin(new Request("http://localhost:3000/api/auth/join-google", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: "rsu-k7m2" }),
    }));
  expect(response.status).toBe(200);
  applyCookies(response);
  const returnUrl = new URL(state.callback);
  returnUrl.searchParams.set("code", "test-only");
  const completed = await callback(new Request(returnUrl));
  applyCookies(completed);
  expect(completed.headers.get("location")).toBe(`http://localhost:3000${kind === "normal" ? "/" : "/join?from=rsu-k7m2"}`);
  const consented = await consent();
  expect(consented.status).toBe(200);
  applyCookies(consented);
  await navigate("/call");
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service");
  vi.stubEnv("STUDY_VISIT_SIGNING_KEY", "test-secret");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  __resetGuard();
  state.cookies = {};
  state.signedIn = false;
  state.callback = "";
  state.signOut.mockReset().mockImplementation(async () => { state.signedIn = false; return { error: null }; });
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("login → consent → interview → exit → landing", () => {
  it.each(["normal", "invite"] as const)("preserves the signed-in landing after %s login", async (kind) => {
    await login(kind);
    expect(state.cookies[DEVICE_INVITE_COOKIE]).toBe("rsu-k7m2");
    const callsBeforeExit = state.signOut.mock.calls.length;
    const classroom = await CallPage({ searchParams: Promise.resolve({}) });
    const destination = classroom.props.homeHref;
    expect(destination).toBe(kind === "normal" ? "/" : "/join?from=rsu-k7m2");
    await navigate(destination);
    const view = await getLandingView(destination);
    expect(view.session).toEqual({ kind: "signedIn", consentedThisVisit: true });
    const landing = kind === "normal" ? await LandingPage()
      : await JoinPage({ searchParams: Promise.resolve({ from: "rsu-k7m2" }) });
    const html = renderToStaticMarkup(landing);
    expect(html).toContain("Profile");
    expect(html).toContain("Join Interview");
    expect(await (await auth()).json()).toEqual({ signedIn: true });
    expect(state.signOut.mock.calls.length).toBe(callsBeforeExit);
  });

  it("reproduces the wrong invite home followed by guest practice bouncing to the signed-in home", async () => {
    await login("normal");
    expect(state.cookies[JOIN_FROM_COOKIE]).toBeUndefined();
    // Before the patch, CallPage used this shared device-based destination.
    const oldDestination = await sessionHome();
    expect(oldDestination).toBe("/join?from=rsu-k7m2");
    await navigate(oldDestination);
    const view = await getLandingView(oldDestination);
    expect(view.session.kind).toBe("signedOut");
    expect(await (await auth()).json()).toEqual({ signedIn: true });
    const html = renderToStaticMarkup(await JoinPage({
      searchParams: Promise.resolve({ from: "rsu-k7m2" }),
    }));
    expect(html).toContain("Login");
    expect(html).not.toContain("Profile");

    // The misleading guest CTA reaches middleware, which still sees the login.
    const guestRequest = new NextRequest("http://localhost:3000/call?guest=1");
    for (const [name, value] of Object.entries(state.cookies)) guestRequest.cookies.set(name, value);
    const guestResponse = await middleware(guestRequest);
    expect(guestResponse.headers.get("location")).toBe("http://localhost:3000/");
    applyCookies(guestResponse);
    expect(renderToStaticMarkup(await LandingPage())).toContain("Profile");
    expect(renderToStaticMarkup(await LandingPage())).toContain("Join Interview");
    expect(await (await auth()).json()).toEqual({ signedIn: true });
  });
});
