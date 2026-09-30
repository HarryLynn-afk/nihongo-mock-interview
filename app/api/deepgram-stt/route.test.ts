import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/deepgram-stt", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
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
