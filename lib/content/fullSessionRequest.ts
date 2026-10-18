/** This-visit flag. The address itself stays in `full_session_requests`. */
export const FULL_SESSION_REQUEST_KEY = "nihongo-full-session-request";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRequestEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

export function readFullSessionRequestSent(): boolean {
  try {
    return sessionStorage.getItem(FULL_SESSION_REQUEST_KEY) === "sent";
  } catch {
    return false;
  }
}

export function markFullSessionRequestSent(): void {
  try {
    sessionStorage.setItem(FULL_SESSION_REQUEST_KEY, "sent");
  } catch {
    // The server saved the request; optional local storage cannot undo success.
  }
}
