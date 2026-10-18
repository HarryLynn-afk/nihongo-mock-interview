import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const { getUser, maybeSingle, cookieValues } = vi.hoisted(() => ({
  getUser: vi.fn(), maybeSingle: vi.fn(), cookieValues: {} as Record<string, string>,
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => [], set: vi.fn(),
  get: (name: string) => cookieValues[name] ? { value: cookieValues[name] } : undefined,
}) }));

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/deepgram-stt", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.STUDY_VISIT_SIGNING_KEY = "test-secret";
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({ data: { participant_id: "P001" }, error: null });
    cookieValues.nihongo_visit_id = "visit-1";
    cookieValues.nihongo_visit_consented = createHmac("sha256", "test-secret")
      .update("user-1:visit-1:2026-09-08").digest("base64url");
  });

  it("does not mint paid tokens for anonymous visitors", async () => {
    process.env.DEEPGRAM_STT_API_KEY = "dg-server-only";
    getUser.mockResolvedValue({ data: { user: null } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "token" }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/deepgram-stt", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns 503 when the Deepgram STT key is missing", async () => {
    delete process.env.DEEPGRAM_STT_API_KEY;
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/deepgram-stt", { method: "POST" }),
    );
    expect(res.status).toBe(503);
  });

  it.each(["forged consent", "missing participant", "database error"])("does not mint with %s", async (failure) => {
    process.env.DEEPGRAM_STT_API_KEY = "dg-server-only";
    if (failure === "forged consent") cookieValues.nihongo_visit_consented = "forged";
    else maybeSingle.mockResolvedValue({ data: null, error: failure === "database error" ? {} : null });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/deepgram-stt", { method: "POST" }));
    expect(response.status).toBe(failure === "database error" ? 503 : 401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns only the ephemeral access token", async () => {
    process.env.DEEPGRAM_STT_API_KEY = "dg-server-only";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "dg-live" }),
      }),
    );
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/deepgram-stt", { method: "POST" }),
    );
    const body = (await res.json()) as { accessToken?: string };
    expect(res.status).toBe(200);
    expect(body.accessToken).toBe("dg-live");
    expect(JSON.stringify(body)).not.toContain("dg-server-only");
  });

  it("returns 503 when Deepgram rejects the grant request", async () => {
    process.env.DEEPGRAM_STT_API_KEY = "dg-server-only";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ err_msg: "Invalid credentials" }),
      }),
    );
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/deepgram-stt", { method: "POST" }),
    );
    expect(res.status).toBe(503);
  });
});
