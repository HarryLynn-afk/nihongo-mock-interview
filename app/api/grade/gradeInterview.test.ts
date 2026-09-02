import { afterEach, describe, expect, it, vi } from "vitest";
import { gradeInterview } from "./gradeInterview";
import type { InterviewReport } from "./runGroqGrade";

const answers = [
  {
    questionIndex: 0,
    inputMode: "voice" as const,
    transcript: "はじめまして。",
    pushbackCount: 0 as const,
    forced: false,
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
  afterEach(() => {
    vi.useRealTimers();
  });
  it("uses a valid n8n report and does not call the Groq fallback", async () => {
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
    expect(posted.profile).toBeUndefined();
    expect(posted.answers).toEqual(answers);
  });

  it("calls the Groq fallback once when n8n exceeds timeoutMs, without retrying n8n", async () => {
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

  it("waits 20s for n8n by default before calling the Groq fallback", async () => {
    vi.useFakeTimers();
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

    const pending = gradeInterview({
      answers,
      n8nFetch,
      getWebhookUrl: () => "https://example.com/webhook/nihongo-grade",
      fallback,
    });

    await vi.advanceTimersByTimeAsync(19_999);
    expect(fallback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    const report = await pending;

    expect(report).toEqual(fallbackReport);
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("uses the sample report with the scoring-unavailable banner when n8n and the Groq fallback both fail", async () => {
    const n8nFetch = vi.fn().mockRejectedValue(new Error("n8n down"));
    const fallback = vi.fn().mockResolvedValue(null);

    const report = await gradeInterview({
      answers,
      n8nFetch,
      getWebhookUrl: () => "https://example.com/webhook/nihongo-grade",
      fallback,
    });

    expect(report?.source).toBe("sample");
    expect(report?.banner).toBe("Scoring unavailable — sample report.");
    expect(report?.headline).toBe("Ready");
    expect(fallback).toHaveBeenCalledOnce();
    expect(n8nFetch).toHaveBeenCalledOnce();
  });
});
