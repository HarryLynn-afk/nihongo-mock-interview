/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  proof: "",
  getUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "nihongo_visit_id") return { value: "visit-1" };
      if (name === "nihongo_visit_consented") return { value: state.proof };
      return undefined;
    },
  }),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => ({ auth: { getUser: state.getUser } }),
}));

describe("participant CallPage", () => {
  it("provides a server-signed grading attempt for a consented participant", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    state.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    state.proof = (await createVisitConsentProof("user-1", "visit-1"))!;

    const { default: CallPage } = await import("./page");
    const element = await CallPage({ searchParams: Promise.resolve({}) });
    const { readStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");

    expect(typeof element.props.attemptToken).toBe("string");
    expect(await readStudyAttemptToken("user-1", element.props.attemptToken)).toBeTruthy();
  });
});
