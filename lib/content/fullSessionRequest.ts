/** This-visit flag. The address itself stays in `full_session_requests`. */
export const FULL_SESSION_REQUEST_KEY = "nihongo-full-session-request";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRequestEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}

export function readFullSessionRequestSent(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(FULL_SESSION_REQUEST_KEY) === "sent";
}

export function markFullSessionRequestSent(): void {
  sessionStorage.setItem(FULL_SESSION_REQUEST_KEY, "sent");
}
