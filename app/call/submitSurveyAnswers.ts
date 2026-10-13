import type { SurveyPayload } from "@/lib/content/survey";

/** Bound the visible submission so a stalled request cannot trap the dialog. */
export const SURVEY_SUBMIT_TIMEOUT_MS = 15_000;

export type SurveySubmitOutcome = "submitted" | "retry" | "uncertain";

export async function submitSurveyAnswers({
  attemptToken,
  survey,
}: {
  attemptToken: string;
  survey: SurveyPayload;
}): Promise<SurveySubmitOutcome> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    SURVEY_SUBMIT_TIMEOUT_MS,
  );
  try {
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey }),
      signal: controller.signal,
    });
    if (response.status === 202) return "submitted";
    if (response.status === 409) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return result?.error === "not saved" ? "retry" : "uncertain";
    }
    return "retry";
  } catch {
    return "uncertain";
  } finally {
    window.clearTimeout(timeout);
  }
}
