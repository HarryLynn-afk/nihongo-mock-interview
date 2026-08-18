/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/scribe", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      ELEVENLABS_SCRIBE_API_KEY: "test-scribe-key",
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

  it("returns { transcript } from Scribe using ELEVENLABS_SCRIBE_API_KEY", async () => {
    const scribeFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はじめまして。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", scribeFetch);

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
    expect(scribeFetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/speech-to-text",
      expect.objectContaining({
        headers: expect.objectContaining({
          "xi-api-key": "test-scribe-key",
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
