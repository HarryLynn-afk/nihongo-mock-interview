import { describe, expect, it, vi } from "vitest";
import { whisperSpeech } from "./whisperSpeech";

describe("whisperSpeech", () => {
  it("returns the Japanese transcript when Groq responds with text", async () => {
    const whisperFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "  はじめまして。  " }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const transcript = await whisperSpeech({
      audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
      whisperFetch,
      getSttKey: () => "test-stt-key",
    });

    expect(transcript).toBe("はじめまして。");
  });

  it("returns null without throwing when the Groq fetch rejects", async () => {
    const whisperFetch = vi.fn().mockRejectedValue(new Error("network down"));

    const transcript = await whisperSpeech({
      audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
      whisperFetch,
      getSttKey: () => "test-stt-key",
    });

    expect(transcript).toBeNull();
  });

  it("returns null without throwing when Groq responds with an error", async () => {
    const whisperFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "should-not-use" }), {
        status: 500,
      }),
    );

    const transcript = await whisperSpeech({
      audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
      whisperFetch,
      getSttKey: () => "test-stt-key",
    });

    expect(transcript).toBeNull();
  });

  it("returns null without throwing when Groq takes longer than timeoutMs", async () => {
    let capturedSignal: AbortSignal | undefined;
    const whisperFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    const transcript = await whisperSpeech({
      audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
      whisperFetch,
      getSttKey: () => "test-stt-key",
      timeoutMs: 50,
    });

    expect(transcript).toBeNull();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("posts the audio clip to Groq Whisper as Japanese with the injected key", async () => {
    const whisperFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はい。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const audio = new Blob([new Uint8Array([1, 2, 3, 4])], {
      type: "audio/mp4",
    });

    await whisperSpeech({
      audio,
      whisperFetch,
      getSttKey: () => "test-stt-key",
    });

    expect(whisperFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-stt-key",
        }),
      }),
    );

    const init = whisperFetch.mock.calls[0][1] as RequestInit;
    const body = init.body as FormData;
    expect(body.get("model")).toBe("whisper-large-v3-turbo");
    expect(body.get("language")).toBe("ja");
    const file = body.get("file");
    expect(file).toBeInstanceOf(Blob);
    expect((file as Blob).type).toBe("audio/mp4");
  });

  it("names a WAV clip answer.wav for Groq Whisper", async () => {
    const whisperFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はい。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await whisperSpeech({
      audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" }),
      whisperFetch,
      getSttKey: () => "test-stt-key",
    });

    const init = whisperFetch.mock.calls[0][1] as RequestInit;
    const file = (init.body as FormData).get("file") as File;
    expect(file.name).toBe("answer.wav");
  });
});
