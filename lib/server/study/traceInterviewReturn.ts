type ReturnTrace = {
  stage: "classroom" | "landing";
  destination: string;
  hasLoginInvite: boolean;
  hasDeviceInvite: boolean;
  session?: "signedIn" | "signedOut";
  reason?: "visit-closed" | "invite-mismatch" | "auth-unconfigured" | "no-user" | "authenticated";
};

// Temporary local diagnostics: never log invite codes, cookies, or user identity.
export function traceInterviewReturn(event: ReturnTrace) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[interview-return]", {
    ...event,
    destination: event.destination.split("?")[0],
  });
}
