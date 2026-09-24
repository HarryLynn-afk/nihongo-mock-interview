import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const { createServerClient, getUser, maybeSingle, cookieValues } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  cookieValues: {} as Record<string, string>,
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: (name: string) =>
      cookieValues[name] ? { value: cookieValues[name] } : undefined,
    set: vi.fn(),
  }),
}));

describe("GET /api/study/me", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    for (const key of Object.keys(cookieValues)) delete cookieValues[key];
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@gmail.com" } },
    });
    maybeSingle.mockResolvedValue({
      data: { participant_id: "P001", consent_at: "2026-09-22T00:00:00Z" },
    });
    createServerClient.mockReturnValue({
      auth: { getUser },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    });
  });

  it("requires consent for this visit even when the account consented earlier", async () => {
    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      state: "consentRequired",
      participantId: "P001",
      account: { email: "tester@gmail.com" },
    });
  });

  it("lets a tester with proof for this visit enter the classroom", async () => {
    const visitId = "visit-1";
    cookieValues.nihongo_visit_id = visitId;
    cookieValues.nihongo_visit_consented = createHmac("sha256", "test-secret")
      .update(`user-1:${visitId}:2026-09-08`)
      .digest("base64url");

    const { GET } = await import("./route");
    const response = await GET();

    expect(await response.json()).toMatchObject({
      state: "ready",
      participantId: "P001",
    });
  });

  it("shows the signed-in Google account's display name on its private entry", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "tester@gmail.com",
          user_metadata: { full_name: "May Thiri" },
        },
      },
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(await response.json()).toMatchObject({
      account: { displayName: "May Thiri", email: "tester@gmail.com" },
    });
  });
});
