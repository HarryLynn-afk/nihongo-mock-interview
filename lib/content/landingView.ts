export type LandingView =
  | { kind: "signedOut"; origin: string }
  | { kind: "signedIn"; origin: string; consentedThisVisit: boolean };
