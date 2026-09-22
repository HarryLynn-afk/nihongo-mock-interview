/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const GROQ_GRADE_JSON = {
  scores: {
    speaking: 5,
    listening: 4,
    grammarPoliteness: 4,
    motivation: 5,
    studyPlan: 5,
    consistency: 4,
  },
  critiques: [
    {
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Use です/ます all the way through.",
      rewrite: "はじめまして。",
      category: "speaking",
    },
  ],
};

function groqFetchMock() {
  return vi.fn((input: RequestInfo | URL) => {
    if (String(input).includes("api.groq.com")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(GROQ_GRADE_JSON) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }
    return Promise.resolve(new Response("unexpected url", { status: 500 }));
  });
}

describe("POST /api/score", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      GROQ_GRADE_API_KEY: "test-grade-key",
    };
    delete process.env.N8N_WEBHOOK_URL;
    delete process.env.DEEPSEEK_GRADE_API_KEY;
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    const { resetGroqCapacityForTests } = await import("../groqCapacity");
    resetGroqCapacityForTests();
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

  it("returns { report } from Groq and does not call n8n", async () => {
    const fetchMock = groqFetchMock();
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
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: { source: string; headline: string; banner: string | null };
    };
    expect(body.report.source).toBe("grade");
    expect(body.report.headline).toBe("Ready");
    expect(body.report.banner).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.groq.com");
    expect(
      fetchMock.mock.calls.some((call) =>
        String(call[0]).includes("webhook/nihongo-grade"),
      ),
    ).toBe(false);
  });

  it("does not call /api/grade", async () => {
    const fetchMock = groqFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    await POST(
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionIndex: 0,
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/grade")),
    ).toBe(false);
  });

  it("returns a live grade from DeepSeek when Groq rate-limits", async () => {
    process.env.DEEPSEEK_GRADE_API_KEY = "test-deepseek-key";
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes("api.groq.com")) {
        return Promise.resolve(
          new Response("Too Many Requests", { status: 429 }),
        );
      }
      if (String(input).includes("api.deepseek.com")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [
                { message: { content: JSON.stringify(GROQ_GRADE_JSON) } },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response("unexpected url", { status: 500 }));
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
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: { source: string; headline: string; banner: string | null };
    };
    expect(body.report.source).toBe("grade");
    expect(body.report.headline).toBe("Ready");
    expect(body.report.banner).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/429|Too Many Requests|rate limit/i);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("api.deepseek.com");
  });

  it("returns report null when Groq misses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionIndex: 0,
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: null };
    expect(body.report).toBeNull();
  });

  it("returns report null when Groq rate-limits, without a 429 in the JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Too Many Requests", { status: 429 })),
    );

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionIndex: 0,
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: null };
    expect(body.report).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/429|Too Many Requests|rate limit/i);
  });

  it("skips Groq on the next score after a 429 and still returns null", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }))
      .mockImplementation(groqFetchMock());
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const payload = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [
          {
            questionIndex: 0,
            transcript: "はじめまして。",
            pushbackCount: 0,
          },
        ],
      }),
    };

    const first = await POST(new Request("http://localhost/api/score", payload));
    const second = await POST(new Request("http://localhost/api/score", payload));

    const firstBody = (await first.json()) as { report: null };
    const secondBody = (await second.json()) as { report: null };
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstBody.report).toBeNull();
    expect(secondBody.report).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
