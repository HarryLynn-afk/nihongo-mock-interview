/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/scribe", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      GROQ_STT_API_KEY: "test-stt-key",
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns 400 when the audio file is missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/scribe", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns { transcript } from Groq Whisper using GROQ_STT_API_KEY", async () => {
    const whisperFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はじめまして。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", whisperFetch);

    const { POST } = await import("./route");
    const form = new FormData();
    form.append(
      "audio",
      new File([new Uint8Array([1, 2, 3])], "answer.webm", {
        type: "audio/webm",
      }),
    );

    const res = await POST(
      new Request("http://localhost/api/scribe", {
        method: "POST",
        body: form,
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transcript: "はじめまして。" });
    expect(whisperFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-stt-key",
        }),
      }),
    );
  });

  it("returns 400 when the body is not a form", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/scribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
  });
});
