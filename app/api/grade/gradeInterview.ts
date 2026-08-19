import { profile } from "@/lib/content/profile";
import type { GradeAnswer, InterviewReport } from "./runGroqGrade";

export async function gradeInterview({
  answers,
  n8nFetch,
  getWebhookUrl,
  fallback,
  timeoutMs = 10_000,
}: {
  answers: GradeAnswer[];
  n8nFetch: typeof fetch;
  getWebhookUrl: () => string;
  fallback: () => Promise<InterviewReport | null>;
  timeoutMs?: number;
}): Promise<InterviewReport | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await n8nFetch(getWebhookUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, answers }),
    });
    if (!res.ok) return fallback();
    const data = (await res.json()) as InterviewReport;
    if (typeof data?.headline === "string") {
      return { ...data, source: "n8n", banner: null };
    }
    return fallback();
  } catch {
    return fallback();
  } finally {
    clearTimeout(timeout);
  }
}
