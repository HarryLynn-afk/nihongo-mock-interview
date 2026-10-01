export type InviteStatus = "none" | "open" | "full" | "unknown";

export type LandingSession =
  | { kind: "signedOut" }
  | { kind: "signedIn"; consentedThisVisit: boolean };

/**
 * Everything the landing module needs to render. The route resolves facts
 * (invite status, session); `Home` owns presentation.
 */
export type LandingView = {
  origin: string;
  invite: InviteStatus;
  from: string | null;
  session: LandingSession;
};
