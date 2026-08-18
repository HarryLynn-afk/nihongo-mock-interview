/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/score", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      GEMINI_GRADE_API_KEY: "test-grade-key",
      N8N_WEBHOOK_URL: "https://example.com/webhook/nihongo-grade",
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns 400 when answers are missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns { report } from n8n and does not call Gemini", async () => {
    const n8nReport = {
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
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(n8nReport), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/score", {
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
    expect(await res.json()).toEqual({ report: n8nReport });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/webhook/nihongo-grade",
      expect.objectContaining({ method: "POST" }),
    );
    expect(
      fetchMock.mock.calls.some((call) =>
        String(call[0]).includes("generativelanguage.googleapis.com"),
      ),
    ).toBe(false);
  });

  it("returns { report } from in-process Gemini once when n8n errors, without calling /api/grade", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          scores: {
                            speaking: 5,
                            listening: 4,
                            grammarPoliteness: 4,
                            motivation: 5,
                            studyPlan: 5,
                            consistency: 4,
                          },
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
      }
      return Promise.resolve(new Response("workflow down", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionIndex: 0,
              inputMode: "typed",
              transcript: "はじめまして。",
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: { source: string; headline: string } };
    expect(body.report.source).toBe("grade");
    expect(body.report.headline).toBe("Ready");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/grade")),
    ).toBe(false);
  });
});
