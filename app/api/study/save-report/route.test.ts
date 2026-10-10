/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const study = vi.hoisted(() => ({
  userId: "user-1",
  visit: { id: "visit-1", proof: "" },
  writes: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => name === "nihongo_visit_id"
      ? { value: study.visit.id }
      : name === "nihongo_visit_consented"
        ? { value: study.visit.proof }
        : undefined,
  }),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: study.userId } } }) },
  }),
}));

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({
          data: table === "participants" ? { participant_id: "P001" } : null,
          error: null,
        }) }),
      }),
      insert: async (row: Record<string, unknown>) => {
        study.writes(row);
        return { error: null };
      },
    }),
  }),
}));

const ORIGINAL_ENV = { ...process.env };

async function receiptFor(userId: string) {
  process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
  const { createStudySaveReceipt } = await import("@/lib/server/study/scoreAttempt");
  const { getSampleReport } = await import("@/lib/content/sampleReport");
  return createStudySaveReceipt({
    userId,
    attemptId: "attempt-1",
    report: getSampleReport(null),
    answers: [{
      questionIndex: 0,
      questionId: 1,
      status: "answered",
      transcript: "はい。",
      pushbackCount: 0,
      isFollowUp: false,
    }],
  });
}

async function consentFor(userId: string) {
  const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
  study.visit.proof = (await createVisitConsentProof(userId, study.visit.id))!;
}

describe("POST /api/study/save-report", () => {
  beforeEach(() => {
    vi.resetModules();
    study.userId = "user-1";
    study.writes.mockReset();
    process.env = { ...ORIGINAL_ENV, STUDY_VISIT_SIGNING_KEY: "test-secret" };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("rejects a tampered save receipt without writing a study session", async () => {
    await consentFor("user-1");
    const receipt = (await receiptFor("user-1"))!;
    const [encodedPayload, signature] = receipt.split(".");
    const changedPayload = `${encodedPayload[0] === "A" ? "B" : "A"}${encodedPayload.slice(1)}`;
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost/api/study/save-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveReceipt: `${changedPayload}.${signature}` }),
    }));

    expect(response.status).toBe(401);
    expect(study.writes).not.toHaveBeenCalled();
  });

  it("rejects another participant's receipt without writing a study session", async () => {
    const receipt = (await receiptFor("user-1"))!;
    study.userId = "user-2";
    await consentFor("user-2");
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost/api/study/save-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveReceipt: receipt }),
    }));

    expect(response.status).toBe(401);
    expect(study.writes).not.toHaveBeenCalled();
  });
});
