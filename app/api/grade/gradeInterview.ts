import {
  getSampleReport,
  SCORING_UNAVAILABLE_BANNER,
} from "@/lib/content/sampleReport";
import { parseQuotedCritiques } from "@/lib/content/parseQuotedCritiques";
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
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) return finishWithFallback();
    const data = (await res.json()) as InterviewReport & { critiques?: unknown };
    const critiques = parseQuotedCritiques(data?.critiques, answers);
    if (typeof data?.headline === "string" && critiques) {
      return { ...data, critiques, source: "n8n", banner: null };
    }
    return finishWithFallback();
  } catch {
    return finishWithFallback();
  } finally {
    clearTimeout(timeout);
  }
}
