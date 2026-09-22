import { normalizeRequestEmail } from "@/lib/content/fullSessionRequest";

export type FullSessionRequestOutcome = "ok" | "invalid" | "unavailable";

/**
 * Saves one Guest email onto `full_session_requests`.
 * Does not write `invited_emails` and does not send mail.
 */
export async function saveFullSessionRequest(
  email: unknown,
  upsert: (normalized: string) => Promise<{ ok: boolean }>,
): Promise<FullSessionRequestOutcome> {
  if (typeof email !== "string") return "invalid";
  const normalized = normalizeRequestEmail(email);
  if (!normalized) return "invalid";
  const saved = await upsert(normalized);
  if (!saved.ok) return "unavailable";
  return "ok";
}
