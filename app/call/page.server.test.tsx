/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  proof: "",
  cookies: {} as Record<string, string>,
  lookupJoinLink: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "nihongo_visit_id") return { value: "visit-1" };
      if (name === "nihongo_visit_consented") return { value: state.proof };
      return state.cookies[name] ? { value: state.cookies[name] } : undefined;
    },
  }),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: async () => ({ auth: { getUser: state.getUser } }),
}));

vi.mock("@/lib/server/study/lookupJoinLink", () => ({
  lookupJoinLink: state.lookupJoinLink,
}));

describe("participant CallPage", () => {
  beforeEach(() => {
    state.cookies = {};
    state.lookupJoinLink.mockReset();
  });
  it("provides a server-signed grading attempt for a consented participant", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    state.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    state.proof = (await createVisitConsentProof("user-1", "visit-1"))!;

    const { default: CallPage } = await import("./page");
    const element = await CallPage({ searchParams: Promise.resolve({}) });
    const { readStudyAttemptToken } = await import("@/lib/server/study/scoreAttempt");

    expect(element.props.homeHref).toBe("/");
    expect(typeof element.props.attemptToken).toBe("string");
    expect(await readStudyAttemptToken("user-1", element.props.attemptToken)).toBeTruthy();
  });

  it("returns a normal-login participant home despite an older device invite", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    state.cookies = { nihongo_device_invite: "OLD" };
    state.lookupJoinLink.mockResolvedValue({ signupCount: 0, maxSignups: 10 });
    state.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    state.proof = (await createVisitConsentProof("user-1", "visit-1"))!;
    const { default: CallPage } = await import("./page");
    const element = await CallPage({ searchParams: Promise.resolve({}) });
    expect(element.props.homeHref).toBe("/");
  });

  it("returns an invite participant to their login invite even when full", async () => {
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    state.cookies = { nihongo_device_invite: "OLD", nihongo_join_from: "CURRENT" };
    state.lookupJoinLink.mockResolvedValue({ signupCount: 10, maxSignups: 10 });
    state.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { createVisitConsentProof } = await import("@/lib/server/study/visitConsent");
    state.proof = (await createVisitConsentProof("user-1", "visit-1"))!;
    const { default: CallPage } = await import("./page");
    const element = await CallPage({ searchParams: Promise.resolve({}) });
    expect(element.props.homeHref).toBe("/join?from=CURRENT");
    expect(state.lookupJoinLink).not.toHaveBeenCalled();
  });

  it("keeps the device invite destination for a guest", async () => {
    state.cookies = { nihongo_device_invite: "OLD" };
    state.lookupJoinLink.mockResolvedValue({ signupCount: 0, maxSignups: 10 });
    const { default: CallPage } = await import("./page");
    const element = await CallPage({ searchParams: Promise.resolve({ guest: "1" }) });
    expect(element.props.homeHref).toBe("/join?from=OLD");
    expect(element.props.attemptToken).toBeUndefined();
  });
});
