export type JoinLinkRecord = {
  signupCount: number;
  maxSignups: number;
};

export const JOIN_FROM_COOKIE = "nihongo_join_from";

/**
 * This device's sign-up invite. Longer-lived than the transient join cookie:
 * it survives sign-out so the next tester can sign up from the same link.
 */
export const DEVICE_INVITE_COOKIE = "nihongo_device_invite";

export const DEVICE_INVITE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type JoinPageView = {
  status: "open" | "full" | "unknown";
  showGoogle: boolean;
};

export type JoinClaimResult =
  | { ok: true; consumeSlot: boolean }
  | { ok: false; status: "full" | "unknown" };

export function readJoinFrom(search: string): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const from = new URLSearchParams(query).get("from")?.trim();
  return from ? from : null;
}

export function joinPageView(
  from: string | null | undefined,
  link: JoinLinkRecord | null,
): JoinPageView {
  if (!from || !link) {
    return { status: "unknown", showGoogle: false };
  }
  if (link.signupCount >= link.maxSignups) {
    return { status: "full", showGoogle: false };
  }
  return { status: "open", showGoogle: true };
}

export function joinClaimResult(
  from: string | null | undefined,
  link: JoinLinkRecord | null,
  alreadyParticipant: boolean,
): JoinClaimResult {
  if (alreadyParticipant) {
    return { ok: true, consumeSlot: false };
  }
  const view = joinPageView(from, link);
  if (view.status === "open") {
    return { ok: true, consumeSlot: true };
  }
  return { ok: false, status: view.status };
}

export async function startJoinGoogle({
  from,
  origin,
  lookup,
  createOAuthUrl,
}: {
  from: string | null;
  origin: string;
  lookup: (code: string) => Promise<JoinLinkRecord | null>;
  createOAuthUrl: (redirectTo: string) => Promise<string | null>;
}): Promise<{ url: string | null }> {
  const link = from ? await lookup(from) : null;
  const view = joinPageView(from, link);
  if (!from || !view.showGoogle) {
    return { url: null };
  }
  const url = await createOAuthUrl(
    `${origin}/auth/callback?from=${encodeURIComponent(from)}`,
  );
  return { url };
}

export async function applyJoinClaim({
  from,
  email,
  alreadyParticipant,
  lookup,
  addToWaitlist,
  consumeSlot,
}: {
  from: string | null;
  email: string;
  alreadyParticipant: boolean;
  lookup: (code: string) => Promise<JoinLinkRecord | null>;
  addToWaitlist: (email: string) => Promise<void>;
  consumeSlot: (code: string) => Promise<boolean>;
}): Promise<JoinClaimResult> {
  const link = from ? await lookup(from) : null;
  const result = joinClaimResult(from, link, alreadyParticipant);
  if (!result.ok || !from) {
    return result;
  }
  if (result.consumeSlot) {
    const consumed = await consumeSlot(from);
    if (!consumed) {
      return { ok: false, status: "full" };
    }
    await addToWaitlist(email);
  }
  return result;
}
