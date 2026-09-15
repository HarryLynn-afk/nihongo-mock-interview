/**
 * Pitch demo gate (CSC 492 oral-exam path). Optional — missing var
 * fail-closes Pitch (unlock never succeeds) and must not break Guest
 * practice, so we do NOT `requireEnv` this one.
 */
export function getPitchAccessKey(): string | null {
  return process.env.PITCH_ACCESS_KEY || null;
}
