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
      GEMINI_GRADE_API_KEY: "test-grade-key",
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

  it("returns { report } from Gemini using GEMINI_GRADE_API_KEY and gemini-3.6-flash", async () => {
    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      scores: SAMPLE_SCORES,
                      coaching: ["Use です/ます all the way through."],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", geminiFetch);

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
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: { headline: string; source: string } };
    expect(body.report.headline).toBe("Ready");
    expect(body.report.source).toBe("grade");
    expect(geminiFetch).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-goog-api-key": "test-grade-key",
        }),
      }),
    );
  });
});
