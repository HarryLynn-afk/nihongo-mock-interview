export const CONSENT_VERSION = "2026-09-08";

export const MAGIC_LINK_COPY =
  "If this email is eligible, a sign-in link has been sent.";

export const GUEST_BANNER =
  "Guest practice is not saved and is not part of the study.";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
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
