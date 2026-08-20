import { profile } from "@/lib/content/profile";
import {
  getSampleReport,
  SCORING_UNAVAILABLE_BANNER,
} from "@/lib/content/sampleReport";
import type { GradeAnswer, InterviewReport } from "./runGroqGrade";

export async function gradeInterview({
  answers,
  n8nFetch,
  getWebhookUrl,
  fallback,
  timeoutMs = 20_000,
}: {
  answers: GradeAnswer[];
  n8nFetch: typeof fetch;
  getWebhookUrl: () => string;
  fallback: () => Promise<InterviewReport | null>;
  timeoutMs?: number;
}): Promise<InterviewReport> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  async function finishWithFallback(): Promise<InterviewReport> {
    return (
      (await fallback()) ?? getSampleReport(SCORING_UNAVAILABLE_BANNER)
    );
  }

  try {
    const res = await n8nFetch(getWebhookUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, answers }),
    });
    if (!res.ok) return finishWithFallback();
    const data = (await res.json()) as InterviewReport;
    if (typeof data?.headline === "string") {
      return { ...data, source: "n8n", banner: null };
    }
    return finishWithFallback();
  } catch {
    return finishWithFallback();
  } finally {
    clearTimeout(timeout);
  }
}
