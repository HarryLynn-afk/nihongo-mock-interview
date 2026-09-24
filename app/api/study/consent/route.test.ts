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
  visitId,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  participantMaybeSingle: vi.fn(),
  invitedMaybeSingle: vi.fn(),
  insertParticipant: vi.fn(),
  rpc: vi.fn(),
  upsert: vi.fn(),
  joinCookie: { value: "T1" as string | undefined },
  consentGate: { value: "ok" as string | undefined },
  visitId: { value: "visit-1" as string | undefined },
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
      if (name === "nihongo_visit_id" && visitId.value) {
        return { value: visitId.value };
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
      STUDY_VISIT_SIGNING_KEY: "test-secret",
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
    rpc.mockResolvedValue({
      data: { status: "ok", participant_id: "P001" },
      error: null,
    });
    upsert.mockResolvedValue({ error: null });
    joinCookie.value = "T1";
    consentGate.value = "ok";
    visitId.value = "visit-1";
  });

  it("lets a join-link Google user consent and become a Participant", async () => {
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();
    const body = (await res.json()) as { participantId?: string };
    expect(res.status).toBe(200);
    expect(body.participantId).toBe("P001");
    expect(rpc).toHaveBeenCalledWith("enroll_join_participant", {
      google_user_id: "user-1",
      google_email: "classmate@school.org",
      invite_code: "T1",
      version: "2026-09-08",
    });
  });

  it("records a returning participant's consent for this visit", async () => {
    participantMaybeSingle.mockResolvedValue({
      data: { participant_id: "P001" },
      error: null,
    });
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ participantId: "P001" });
    expect(res.headers.get("set-cookie") ?? "").toMatch(
      /nihongo_visit_consented=[^;]+;.*HttpOnly/i,
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it("enrolls a new join-link tester in one database operation", async () => {
    rpc.mockResolvedValueOnce({
      data: { status: "ok", participant_id: "P001" },
      error: null,
    });
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ participantId: "P001" });
    expect(rpc).toHaveBeenCalledWith("enroll_join_participant", {
      google_user_id: "user-1",
      google_email: "classmate@school.org",
      invite_code: "T1",
      version: "2026-09-08",
    });
    expect(insertParticipant).not.toHaveBeenCalled();
  });

  it("does not grant classroom consent when the join link is full", async () => {
    rpc.mockResolvedValueOnce({ data: { status: "full" }, error: null });
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST();

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "join_full" });
    expect(res.cookies.get("nihongo_visit_consented")).toBeUndefined();
    expect(insertParticipant).not.toHaveBeenCalled();
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
