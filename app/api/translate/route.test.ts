import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/translate", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      GROQ_TRANSLATE_API_KEY: "test-translate-key",
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns 400 when japanese is missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: "school interview answer" }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns { english } from Groq using GROQ_TRANSLATE_API_KEY", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Nice to meet you." } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", groqFetch);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japanese: "はじめまして",
          context: "school interview answer",
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ english: "Nice to meet you." });
    expect(groqFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-translate-key",
        }),
      }),
    );
  });

  it("returns 200 { english: null } when Groq errors, without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unavailable", { status: 500 })),
    );

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japanese: "はじめまして",
          context: "school interview answer",
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ english: null });
  });
});
