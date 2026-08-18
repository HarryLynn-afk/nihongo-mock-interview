import { describe, expect, it, vi } from "vitest";
import { scribeSpeech } from "./scribeSpeech";

describe("scribeSpeech", () => {
  it("returns null without throwing when the Scribe fetch rejects", async () => {
    const scribeFetch = vi.fn().mockRejectedValue(new Error("network down"));

    const transcript = await scribeSpeech({
      audioBytes: new Uint8Array([1, 2, 3]),
      scribeFetch,
      getScribeKey: () => "test-scribe-key",
    });

    expect(transcript).toBeNull();
  });

  it("returns the transcript when Scribe responds with text", async () => {
    const scribeFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はじめまして。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const transcript = await scribeSpeech({
      audioBytes: new Uint8Array([1, 2, 3]),
      scribeFetch,
      getScribeKey: () => "test-scribe-key",
    });

    expect(transcript).toBe("はじめまして。");
  });

  it("returns null without throwing when Scribe responds with an error", async () => {
    const scribeFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "should-not-use" }), {
        status: 500,
      }),
    );

    const transcript = await scribeSpeech({
      audioBytes: new Uint8Array([1, 2, 3]),
      scribeFetch,
      getScribeKey: () => "test-scribe-key",
    });

    expect(transcript).toBeNull();
  });

  it("returns null without throwing when Scribe takes longer than timeoutMs", async () => {
    let capturedSignal: AbortSignal | undefined;
    const scribeFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    const transcript = await scribeSpeech({
      audioBytes: new Uint8Array([1, 2, 3]),
      scribeFetch,
      getScribeKey: () => "test-scribe-key",
      timeoutMs: 50,
    });

    expect(transcript).toBeNull();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("posts the audio clip to Scribe with the injected key", async () => {
    const scribeFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はい。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const audioBytes = new Uint8Array([1, 2, 3, 4]);

    await scribeSpeech({
      audioBytes,
      scribeFetch,
      getScribeKey: () => "test-scribe-key",
    });

    expect(scribeFetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/speech-to-text",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "xi-api-key": "test-scribe-key",
        }),
      }),
    );

    const init = scribeFetch.mock.calls[0][1] as RequestInit;
    const body = init.body as FormData;
    expect(body.get("model_id")).toBe("scribe_v1");
    expect(body.get("language_code")).toBe("ja");
    expect(body.get("file")).toBeInstanceOf(Blob);
  });
});
