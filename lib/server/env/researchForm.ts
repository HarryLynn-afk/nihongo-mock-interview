/**
 * Research Google Form (Issue 28) — optional URL. Absence hides the
 * Usefulness step, so we do NOT `requireEnv` this one.
 */
const RESEARCH_FORM_URL = process.env.RESEARCH_FORM_URL;

export function getResearchFormUrl(): string | null {
  return RESEARCH_FORM_URL ? RESEARCH_FORM_URL : null;
}
