import { beforeEach, describe, expect, it, vi } from "vitest";
import { JOIN_FROM_COOKIE } from "@/lib/content/joinLink";
import { CONSENT_GATE_COOKIE } from "@/lib/content/studyAuth";

const ORIGINAL_ENV = { ...process.env };

const {
  getUser,
  participantMaybeSingle,
  invitedMaybeSingle,
  insertParticipant,
  rpc,
  upsert,
  joinCookie,
  consentGate,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  participantMaybeSingle: vi.fn(),
  invitedMaybeSingle: vi.fn(),
  insertParticipant: vi.fn(),
  rpc: vi.fn(),
  upsert: vi.fn(),
  joinCookie: { value: "T1" as string | undefined },
  consentGate: { value: "ok" as string | undefined },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === JOIN_FROM_COOKIE && joinCookie.value) {
        return { value: joinCookie.value };
      }
      if (name === CONSENT_GATE_COOKIE && consentGate.value) {
        return { value: consentGate.value };
      }
      return undefined;
    },
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
    participantMaybeSingle.mockReset();
    invitedMaybeSingle.mockReset();
    insertParticipant.mockReset();
    rpc.mockReset();
    upsert.mockReset();
    participantMaybeSingle.mockResolvedValue({ data: null, error: null });
    invitedMaybeSingle.mockResolvedValue({
      data: { email: "classmate@school.org" },
      error: null,
    });
    insertParticipant.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: true, error: null });
    upsert.mockResolvedValue({ error: null });
    joinCookie.value = "T1";
    consentGate.value = "ok";
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

  it("lets an allowlisted Google login consent without consuming a join slot", async () => {
    joinCookie.value = undefined;
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    const body = (await res.json()) as { participantId?: string };
    expect(res.status).toBe(200);
    expect(body.participantId).toBe("P001");
    expect(rpc).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects Google login when the email is not in invited_emails", async () => {
    joinCookie.value = undefined;
    invitedMaybeSingle.mockResolvedValue({ data: null, error: null });
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    const body = (await res.json()) as { error?: string };
    expect(res.status).toBe(403);
    expect(body.error).toBe("not_invited");
    expect(insertParticipant).not.toHaveBeenCalled();
  });

  it("rejects consent when this visit did not come from a fresh sign-in", async () => {
    consentGate.value = undefined;
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    const body = (await res.json()) as { error?: string };
    expect(res.status).toBe(401);
    expect(body.error).toBe("unauthorized");
    expect(insertParticipant).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
