/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const SAMPLE_SCORES = {
  speaking: 5,
  listening: 4,
  grammarPoliteness: 4,
  motivation: 5,
  studyPlan: 5,
  consistency: 4,
};

describe("POST /api/grade", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      GROQ_GRADE_API_KEY: "test-grade-key",
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns 400 when answers are missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns { report } from Groq using GROQ_GRADE_API_KEY and qwen/qwen3.6-27b", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  scores: SAMPLE_SCORES,
                  critiques: [
                    {
                      questionIndex: 0,
                      quote: "はじめまして",
                      explanation: "Use です/ます all the way through.",
                      rewrite: "はじめまして。",
                      category: "speaking",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", groqFetch);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionIndex: 0,
              inputMode: "voice",
              transcript: "はじめまして。",
              pushbackCount: 0,
              forced: false,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: { headline: string; source: string } };
    expect(body.report.headline).toBe("Ready");
    expect(body.report.source).toBe("grade");
    expect(groqFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-grade-key",
        }),
      }),
    );
    const groqBody = JSON.parse(
      String((groqFetch.mock.calls[0][1] as RequestInit).body),
    ) as { model?: string };
    expect(groqBody.model).toBe("qwen/qwen3.6-27b");
  });
});
