import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/realtime-stt", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 503 when the OpenAI STT key is missing", async () => {
    delete process.env.OPENAI_STT_API_KEY;
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(503);
  });

  it("returns only the ephemeral value", async () => {
    process.env.OPENAI_STT_API_KEY = "sk-server-only";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: "ek_live" }),
      }),
    );
    const { POST } = await import("./route");
    const res = await POST();
    const body = (await res.json()) as { value?: string };
    expect(res.status).toBe(200);
    expect(body.value).toBe("ek_live");
    expect(JSON.stringify(body)).not.toContain("sk-server-only");
    vi.unstubAllGlobals();
  });
});
