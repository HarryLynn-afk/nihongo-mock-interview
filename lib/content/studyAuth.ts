export const CONSENT_VERSION = "2026-09-08";

export const MAGIC_LINK_COPY =
  "If this email is eligible, a sign-in link has been sent.";

export const MAGIC_LINK_EXPIRED_COPY =
  "This sign-in link was already opened or has expired. Mail scanners can open it before you do. Request a new one and click it once.";

export const MAGIC_LINK_MISSING_COPY =
  "No sign-in token was in this link. Request a new one from Participant login.";

export type AuthCallbackIntent =
  | { kind: "code"; code: string }
  | { kind: "otp"; tokenHash: string; type: string }
  | { kind: "hash" }
  | { kind: "error"; message: string }
  | { kind: "none" };

const OTP_TYPES = new Set([
  "invite",
  "magiclink",
  "email",
  "signup",
  "recovery",
  "email_change",
]);

/**
 * Supabase returns the outcome in the query string (PKCE / token_hash) or in the
 * URL fragment (implicit grant, plus `error_code` when the token was already used).
 */
export function readAuthCallback(search: string, hash: string): AuthCallbackIntent {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));

  const errorCode =
    fragment.get("error_code") ??
    query.get("error_code") ??
    fragment.get("error") ??
    query.get("error");
  if (errorCode) {
    return { kind: "error", message: MAGIC_LINK_EXPIRED_COPY };
  }

  const code = query.get("code");
  if (code) return { kind: "code", code };

  const tokenHash = query.get("token_hash");
  const type = query.get("type");
  if (tokenHash && type && OTP_TYPES.has(type)) {
    return { kind: "otp", tokenHash, type };
  }

  if (fragment.get("access_token")) return { kind: "hash" };

  return { kind: "none" };
}

export const GUEST_BANNER =
  "Guest practice is not saved and is not part of the study.";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

/** Hash tokens never reach the server. Rewrite so the URL (and #access_token) stay. */
export function shouldRewriteAuthCallback(pathname: string, search: string): boolean {
  if (pathname !== "/auth/callback") return false;
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  return !params.get("code") && !params.get("token_hash");
}

export function nextParticipantId(existing: readonly string[]): string {
  let max = 0;
  for (const id of existing) {
    const match = /^P(\d+)$/.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `P${String(max + 1).padStart(3, "0")}`;
}

export async function maybeSendMagicLink({
  email,
  allowlisted,
  send,
}: {
  email: string;
  allowlisted: boolean;
  send: (email: string) => Promise<void>;
}): Promise<{ message: string }> {
  if (allowlisted) {
    await send(normalizeEmail(email));
  }
  return { message: MAGIC_LINK_COPY };
}

/** Allowlisted Participant Google: callback has no join `from`. */
export async function startLoginGoogle({
  origin,
  createOAuthUrl,
}: {
  origin: string;
  createOAuthUrl: (redirectTo: string) => Promise<string | null>;
}): Promise<{ url: string | null }> {
  const url = await createOAuthUrl(`${origin}/auth/callback`);
  return { url };
}

/**
 * `/join?from=` still accepts any Google until the cap.
 * `/login` Google (no `from`) only continues when the email is already listed
 * or the user is already a Participant.
 */
export function allowlistedLoginGate({
  from,
  alreadyParticipant,
  allowlisted,
}: {
  from: string | null;
  alreadyParticipant: boolean;
  allowlisted: boolean;
}): { destination: "/consent" | "/login"; reject: boolean } {
  if (from) return { destination: "/consent", reject: false };
  if (alreadyParticipant || allowlisted) {
    return { destination: "/consent", reject: false };
  }
  return { destination: "/login", reject: true };
}
