import type { CallSessionKind } from "@/lib/content/callSession";

/** The single top-right action a report offers. Help the study wins over the
 *  guest email ask, so the two can never render on top of each other. */
export type ReportTopAction = "help" | "request" | null;

export function reportTopAction({
  signedIn,
  sessionKind,
  hasSessionId,
  formEnabled,
}: {
  signedIn: boolean;
  sessionKind: CallSessionKind;
  hasSessionId: boolean;
  formEnabled: boolean;
}): ReportTopAction {
  if (signedIn && hasSessionId && formEnabled) return "help";
  if (sessionKind === "guest") return "request";
  return null;
}
