/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const study = vi.hoisted(() => ({
  getUser: vi.fn(),
  row: { value: null as Record<string, unknown> | null },
  writes: vi.fn(),
  visit: { id: "visit-1", proof: "" },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "nihongo_visit_id") return { value: study.visit.id };
      if (name === "nihongo_visit_consented") return { value: study.visit.proof };
      return undefined;
    },
  }),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => ({ auth: { getUser: study.getUser } }),
}));

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient: () => ({
    from: (table: string) => {
      if (table === "participants") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { participant_id: "P001" }, error: null }),
            }),
          }),
        };
      }
      if (table === "study_sessions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: study.row.value, error: null }),
            }),
          }),
          insert: async (row: Record<string, unknown>) => {
            const result = study.writes(row) as { code?: string } | undefined;
            if (result?.code) return { error: result };
            study.row.value = row;
            return { error: null };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

const ORIGINAL_ENV = { ...process.env };

const GROQ_GRADE_JSON = {
  scores: {
    answerRelevance: 4,
    contentCompleteness: 3,
    japaneseClarity: 4,
    grammarPoliteness: 3,
    consistency: 3,
  },
  critiques: [
    {
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Use です/ます all the way through.",
      rewrite: "はじめまして。",
      category: "japaneseClarity",
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
    study.getUser.mockReset();
    study.writes.mockReset();
    study.row.value = null;
    study.getUser.mockResolvedValue({ data: { user: null } });
    process.env = {
      ...ORIGINAL_ENV,
      GROQ_GRADE_API_KEY: "test-grade-key",
    };
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

  it("rejects a cross-origin POST before spending a grade call", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://evil.example",
        },
        body: JSON.stringify({ answers: [] }),
      }),
    );

    expect(res.status).toBe(403);
  });

  it("returns { report } from Groq", async () => {
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
              questionId: 1,
              topic: "selfIntroduction",
              questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: { source: string; total: number; banner: string | null };
    };
    expect(body.report.source).toBe("grade");
    expect(body.report.total).toBe(86);
    expect(body.report.banner).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.groq.com");
  });

  it("saves a participant grade once and returns the saved report on retry", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@example.com" } },
    });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "attempt-1");
    const fetchMock = groqFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const request = () =>
      new Request("http://localhost/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptToken,
          answers: [
            {
              questionIndex: 0,
              questionId: 1,
              status: "answered",
              transcript: "はじめまして。",
              pushbackCount: 0,
              isFollowUp: true,
            },
          ],
        }),
      });

    const first = await POST(request());
    const firstBody = await first.json();
    const second = await POST(request());

    expect(first.status).toBe(200);
    expect(firstBody.studySave).toBe("saved");
    expect(study.writes).toHaveBeenCalledTimes(1);
    expect(study.row.value?.participant_id).toBe("P001");
    expect(study.row.value?.follow_up_count).toBe(0);
    expect(study.row.value?.report).toEqual(firstBody.report);
    expect(await second.json()).toEqual(firstBody);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the winning saved report when a concurrent request wins the save", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@example.com" } },
    });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "attempt-race");
    const winnerReport = { source: "grade", total: 80 };
    // The winner's insert lands between this request's empty check and its save.
    study.writes.mockImplementationOnce(() => {
      study.row.value = { participant_id: "P001", report: winnerReport };
      return { code: "23505" };
    });
    vi.stubGlobal("fetch", groqFetchMock());

    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptToken,
        answers: [{ questionIndex: 0, questionId: 1, status: "answered", transcript: "はじめまして。", pushbackCount: 0 }],
      }),
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toEqual(winnerReport);
    expect(body.studySave).toBe("saved");
    expect(body.saveReceipt).toBeUndefined();
  });

  it("returns 503 when the winning report cannot be read after a save conflict", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "attempt-race-unreadable");
    study.writes.mockImplementationOnce(() => ({ code: "23505" }));
    vi.stubGlobal("fetch", groqFetchMock());

    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptToken,
        answers: [{ questionIndex: 0, questionId: 1, status: "answered", transcript: "はじめまして。", pushbackCount: 0 }],
      }),
    }));

    expect(res.status).toBe(503);
  });

  it("returns the report with a retry state when the database request throws", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@example.com" } },
    });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "attempt-2");
    study.writes.mockImplementationOnce(() => { throw new Error("database offline"); });
    vi.stubGlobal("fetch", groqFetchMock());

    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptToken,
        answers: [{ questionIndex: 0, questionId: 1, status: "answered", transcript: "はじめまして。", pushbackCount: 0 }],
      }),
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report?.source).toBe("grade");
    expect(body.studySave).toBe("retry");
    expect(study.row.value).toBeNull();
  });

  it("saves the original report after a failed write without grading again", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = (await createStudyAttemptToken("user-1", "attempt-retry"))!;
    const answers = [{ questionIndex: 0, questionId: 1, status: "answered", transcript: "はじめまして。", pushbackCount: 0 }];
    study.writes.mockImplementationOnce(() => { throw new Error("database offline"); });
    const fetchMock = groqFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const { POST: grade } = await import("./route");
    const first = await grade(new Request("http://localhost/api/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, answers }),
    }));
    const firstBody = await first.json();
    expect(firstBody.studySave).toBe("retry");
    expect(firstBody.saveReceipt).toEqual(expect.any(String));

    const { POST: save } = await import("../study/save-report/route");
    const retry = await save(new Request("http://localhost/api/study/save-report", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveReceipt: firstBody.saveReceipt }),
    }));

    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ report: firstBody.report, studySave: "saved" });
    expect(study.row.value?.report).toEqual(firstBody.report);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a participant session that repeats a question ID", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "duplicate-question");
    const fetchMock = groqFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, answers: [0, 1].map((questionIndex) => ({
        questionIndex, questionId: 1, status: "answered", transcript: "はい。", pushbackCount: 0,
      })) }),
    }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(study.writes).not.toHaveBeenCalled();
  });

  it("rejects a participant session with a missing question index", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "missing-index");
    const fetchMock = groqFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, answers: [
        { questionIndex: 0, questionId: 1, status: "answered", transcript: "はい。", pushbackCount: 0 },
        { questionIndex: 2, questionId: 2, status: "answered", transcript: "はい。", pushbackCount: 0 },
      ] }),
    }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
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
              questionId: 1,
              topic: "selfIntroduction",
              questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
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
              questionId: 1,
              topic: "selfIntroduction",
              questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
              transcript: "はじめまして。",
              pushbackCount: 0,
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report: { source: string; total: number; banner: string | null };
    };
    expect(body.report.source).toBe("grade");
    expect(body.report.total).toBe(86);
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
              questionId: 1,
              topic: "selfIntroduction",
              questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
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
              questionId: 1,
              topic: "selfIntroduction",
              questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
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
            questionId: 1,
            topic: "selfIntroduction",
            questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
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
