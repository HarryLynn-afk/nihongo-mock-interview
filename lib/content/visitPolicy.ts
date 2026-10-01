/**
 * One owner for who may be on which learner URL.
 *
 * Visit cookie (`nihongo_consent_gate`, session-only):
 * - Set after a successful /auth/callback (or hash catcher).
 * - Required for /consent and Participant /call (no guest).
 * - Not required for /call?guest=1.
 * - / does not clear it. /login and /join replace a visit via local sign-out
 *   before OAuth (not by middleware clearing this cookie on page load).
 *
 * Join `from` cookie: only between join-google and consent POST.
 * Supabase auth cookies last longer; local signOut on every new Google start
 * is what forgets the leftover account.
 */

import { CONSENT_GATE_COOKIE, consentGateIsOpen } from "./studyAuth";
import { joinPageView, type JoinLinkRecord } from "./joinLink";

export type RouteRole =
  | "guestHome"
  | "participantEntry"
  | "consent"
  | "call"
  | "auth"
  | "other";

export function routeRole(pathname: string): RouteRole {
  if (pathname === "/") return "guestHome";
  if (pathname === "/login" || pathname === "/join") return "participantEntry";
  if (pathname === "/consent") return "consent";
  if (pathname === "/call") return "call";
  if (pathname.startsWith("/auth/")) return "auth";
  return "other";
}

/** `/pitch` and `/call?pitch=1` are not routes. */
export function isRemovedPitchUrl(pathname: string, search: string): boolean {
  if (pathname === "/pitch") return true;
  const query = search.startsWith("?") ? search.slice(1) : search;
  return (
    pathname === "/call" && new URLSearchParams(query).get("pitch") === "1"
  );
}

export function isGuestCall(search: string): boolean {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("guest") === "1";
}

/** Practice Participant classroom — not Guest. */
export function isParticipantCall(pathname: string, search: string): boolean {
  if (pathname !== "/call") return false;
  if (isGuestCall(search)) return false;
  if (isRemovedPitchUrl(pathname, search)) return false;
  return true;
}

/**
 * True when this URL needs an open visit cookie and it is missing.
 * Leftover /consent and Participant /call without a visit → sign in again.
 */
export function mustSignIn(
  pathname: string,
  search: string,
  visitCookie: string | undefined,
): boolean {
  const visitOpen = consentGateIsOpen(visitCookie);
  if (pathname === "/consent") return !visitOpen;
  if (isParticipantCall(pathname, search)) return !visitOpen;
  return false;
}

export function nextAfterAuth({
  from,
  ok,
}: {
  from: string | null;
  ok: boolean;
}): "/" | "/login" | `/join?from=${string}` {
  if (!ok) {
    if (from) return `/join?from=${encodeURIComponent(from)}`;
    return "/login";
  }
  return from ? `/join?from=${encodeURIComponent(from)}` : "/";
}

/**
 * Where a sign-out lands. The invite link is this device's sign-up desk:
 * return to it while it is still open, otherwise the normal landing.
 */
export function signOutDestination(
  inviteCode: string | null,
  link: JoinLinkRecord | null,
): "/" | `/join?from=${string}` {
  return joinPageView(inviteCode, link).status === "open" && inviteCode
    ? `/join?from=${encodeURIComponent(inviteCode)}`
    : "/";
}

/** Re-export so middleware/tests import visit policy from one place. */
export { CONSENT_GATE_COOKIE, consentGateIsOpen };
