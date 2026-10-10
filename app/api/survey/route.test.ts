/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const study = vi.hoisted(() => ({
  getUser: vi.fn(),
  visit: { id: "visit-1", proof: "" },
  row: { value: null as Record<string, unknown> | null },
  claim: { value: null as Record<string, unknown> | null },
  claimWrites: vi.fn(),
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
    from: (table: string) => table === "survey_submissions" ? ({
      insert: async (row: Record<string, unknown>) => {
        study.claimWrites(row);
        if (study.claim.value) return { error: { code: "23505" } };
        study.claim.value = row;
        return { error: null };
      },
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: study.claim.value, error: null }) }) }),
      update: (values: Record<string, unknown>) => ({
        eq: async () => { study.claim.value = { ...study.claim.value, ...values }; return { error: null }; },
      }),
    }) : ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({
          data: table === "participants" ? { participant_id: "P001" } : study.row.value,
          error: null,
        }) }),
      }),
    }),
  }),
}));

const ORIGINAL_ENV = { ...process.env };
const VALID_SURVEY = {
  skipped: false,
  ratings: {
    improveUnderstanding: 4, identifyWeaknesses: 4, rewriteUseful: 4,
    useAgain: 4, easyToUse: 4, clearSteps: 4, reportClear: 4,
    completeEasily: 4, transcriptAccurate: 4, feedbackConsistent: 4,
  },
  openEnded: { mostHelpful: "The rewrite", unclear: "", improvement: "" },
};

async function authorizeSavedAttempt() {
  process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
  process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
  study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
  study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
  const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
  study.row.value = { participant_id: "P001" };
  return (await createStudyAttemptToken("user-1", "attempt-1"))!;
}

describe("GET /api/survey", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RESEARCH_FORM_URL;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns enabled false when RESEARCH_FORM_URL is missing", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ enabled: false });
  });

  it("returns enabled true when RESEARCH_FORM_URL is set", async () => {
    process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ enabled: true });
  });
});

describe("POST /api/survey", () => {
  beforeEach(() => {
    vi.resetModules();
    study.getUser.mockReset();
    study.getUser.mockResolvedValue({ data: { user: null } });
    study.visit.proof = "";
    study.row.value = null;
    study.claim.value = null;
    study.claimWrites.mockReset();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RESEARCH_FORM_URL;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns an error and does not POST to Google when the form URL is missing", async () => {
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skipped: true,
        }),
      }),
    );

    expect(res.status).toBe(503);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("rejects a signed-out survey without forwarding it", async () => {
    process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken: "invalid", survey: { skipped: true } }),
    }));

    expect(res.status).toBe(401);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("rejects a signed-in request without a valid attempt token", async () => {
    process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken: "invalid", survey: { skipped: true } }),
    }));

    expect(res.status).toBe(401);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("rejects a valid attempt without visit consent", async () => {
    process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "attempt-1");
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey: { skipped: true } }),
    }));

    expect(res.status).toBe(401);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("rejects a survey for an attempt whose grade is not saved", async () => {
    process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    study.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    study.visit.proof = (await createVisitConsentProof("user-1", study.visit.id))!;
    const { createStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");
    const attemptToken = await createStudyAttemptToken("user-1", "attempt-1");
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey: { skipped: true } }),
    }));

    expect(res.status).toBe(409);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("rejects malformed ratings without forwarding them", async () => {
    const attemptToken = await authorizeSavedAttempt();
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey: {
        skipped: false,
        ratings: { improveUnderstanding: 6 },
        openEnded: { mostHelpful: "ok" },
      } }),
    }));

    expect(res.status).toBe(400);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("does not forward a direct skipped payload as a blank form row", async () => {
    const attemptToken = await authorizeSavedAttempt();
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey: { skipped: true } }),
    }));

    expect(res.status).toBe(400);
    expect(fakeFetch).not.toHaveBeenCalled();
    expect(study.claimWrites).not.toHaveBeenCalled();
  });

  it("POSTs the payload to the form URL when it is set", async () => {
    const attemptToken = await authorizeSavedAttempt();
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const payload = { attemptToken, survey: VALID_SURVEY };
    const res = await POST(
      new Request("http://localhost/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(202);
    expect(fakeFetch).toHaveBeenCalledWith(
      "https://docs.google.com/forms/d/e/test/formResponse",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("forwards a participant's answers only once without storing them in the claim", async () => {
    const attemptToken = await authorizeSavedAttempt();
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const survey = VALID_SURVEY;
    const request = () => new Request("http://localhost/api/survey", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey }),
    });

    const first = await POST(request());
    const second = await POST(request());

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(study.claim.value).toEqual({ attempt_id: "attempt-1", status: "submitted" });
    expect(study.claimWrites.mock.calls[0][0]).not.toHaveProperty("ratings");
    expect(study.claimWrites.mock.calls[0][0]).not.toHaveProperty("openEnded");
  });

  it("marks a timed-out delivery uncertain and never forwards that attempt again", async () => {
    const attemptToken = await authorizeSavedAttempt();
    const fakeFetch = vi.fn().mockRejectedValue(new Error("timeout"));
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const survey = VALID_SURVEY;
    const request = () => new Request("http://localhost/api/survey", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey }),
    });

    const first = await POST(request());
    const second = await POST(request());

    expect(first.status).toBe(409);
    expect(await first.json()).toEqual({ status: "uncertain" });
    expect(second.status).toBe(409);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(study.claim.value?.status).toBe("uncertain");
  });

  it("reports upstream failure as uncertain after forwarding starts", async () => {
    const attemptToken = await authorizeSavedAttempt();
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptToken, survey: VALID_SURVEY }),
    }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ status: "uncertain" });
  });
});
