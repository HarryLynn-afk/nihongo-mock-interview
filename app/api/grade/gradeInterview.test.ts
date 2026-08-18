import { describe, expect, it, vi } from "vitest";
import { gradeInterview } from "./gradeInterview";
import type { InterviewReport } from "./runGeminiGrade";

const answers = [
  {
    questionIndex: 0,
    inputMode: "voice" as const,
    transcript: "はじめまして。",
  },
];

const n8nReport: InterviewReport = {
  headline: "Ready",
  stamp: "準備OK",
  total: 92,
  scores: {
    speaking: { raw: 5, weight: 20, points: 20 },
    listening: { raw: 4, weight: 15, points: 12 },
    grammarPoliteness: { raw: 4, weight: 15, points: 12 },
    motivation: { raw: 5, weight: 20, points: 20 },
    studyPlan: { raw: 5, weight: 20, points: 20 },
    consistency: { raw: 4, weight: 10, points: 8 },
  },
  gatesFired: [],
  coaching: ["Use です/ます all the way through."],
  profileName: "Aung Min Khant",
  source: "n8n",
  banner: null,
};

describe("gradeInterview", () => {
  it("uses a valid n8n report and does not call the Gemini fallback", async () => {
    const n8nFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(n8nReport), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const fallback = vi.fn();

    const report = await gradeInterview({
      answers,
      n8nFetch,
      getWebhookUrl: () => "https://example.com/webhook/nihongo-grade",
      fallback,
    });

    expect(report).toEqual(n8nReport);
    expect(fallback).not.toHaveBeenCalled();
    expect(n8nFetch).toHaveBeenCalledWith(
      "https://example.com/webhook/nihongo-grade",
      expect.objectContaining({ method: "POST" }),
    );
    const posted = JSON.parse(
      (n8nFetch.mock.calls[0][1] as RequestInit).body as string,
    ) as { profile?: { name?: string }; answers?: unknown };
    expect(posted.profile?.name).toBe("Aung Min Khant");
    expect(posted.answers).toEqual(answers);
  });

  it("calls the Gemini fallback once when n8n exceeds timeoutMs, without retrying n8n", async () => {
    const n8nFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const fallbackReport: InterviewReport = { ...n8nReport, source: "grade" };
    const fallback = vi.fn().mockResolvedValue(fallbackReport);

    const report = await gradeInterview({
      answers,
      n8nFetch,
      getWebhookUrl: () => "https://example.com/webhook/nihongo-grade",
      fallback,
      timeoutMs: 50,
    });

    expect(report).toEqual(fallbackReport);
    expect(fallback).toHaveBeenCalledOnce();
    expect(n8nFetch).toHaveBeenCalledOnce();
  });
});
