import { beforeEach, describe, expect, it, vi } from "vitest";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";

const ORIGINAL_ENV = { ...process.env };

const { getUser, participantMaybeSingle, invitedMaybeSingle, insertParticipant, rpc, upsert } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    participantMaybeSingle: vi.fn(),
    invitedMaybeSingle: vi.fn(),
    insertParticipant: vi.fn(),
    rpc: vi.fn(),
    upsert: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === JOIN_FROM_COOKIE ? { value: "T1" } : undefined,
  }),
}));

vi.mock("@/lib/server/study/serverClient", () => ({
  createStudyServerClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient: () => ({
    rpc,
    from: (table: string) => {
      if (table === "invite_links") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { signup_count: 0, max_signups: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "invited_emails") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: invitedMaybeSingle }),
          }),
          upsert,
        };
      }
      if (table === "participants") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: participantMaybeSingle }),
            then: undefined,
          }),
          insert: insertParticipant,
        };
      }
      return {};
    },
  }),
}));

describe("POST /api/study/consent join link", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "classmate@school.org" } },
    });
    participantMaybeSingle.mockResolvedValue({ data: null, error: null });
    invitedMaybeSingle.mockResolvedValue({
      data: { email: "classmate@school.org" },
      error: null,
    });
    insertParticipant.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: true, error: null });
    upsert.mockResolvedValue({ error: null });
  });

  it("lets a join-link Google user consent and become a Participant", async () => {
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    const body = (await res.json()) as { participantId?: string };
    expect(res.status).toBe(200);
    expect(body.participantId).toBe("P001");
    expect(rpc).toHaveBeenCalledWith("consume_invite_slot", { invite_code: "T1" });
  });
});
