import { describe, expect, it, vi } from "vitest";
import { resolveQuestionAudio } from "./resolveQuestionAudio";

const ttsBytes = new Uint8Array([0x11, 0x22, 0x33]);
const fallbackBytes = new Uint8Array([0xaa, 0xbb, 0xcc]);

describe("resolveQuestionAudio", () => {
  it("returns TTS bytes when ttsFetch resolves within the timeout, without reading fallback", async () => {
    const ttsFetch = vi.fn().mockResolvedValue(ttsBytes);
    const fallbackReader = vi.fn().mockResolvedValue(fallbackBytes);

    const { source, bytes } = await resolveQuestionAudio({
      questionId: 1,
      ttsFetch,
      fallbackReader,
      timeoutMs: 1500,
    });

    expect(source).toBe("tts");
    expect(bytes).toBe(ttsBytes);
    expect(ttsFetch).toHaveBeenCalledOnce();
    expect(fallbackReader).not.toHaveBeenCalled();
  });

  it("returns the local fallback and aborts TTS when ttsFetch takes longer than timeoutMs", async () => {
    let capturedSignal: AbortSignal | undefined;
    const ttsFetch = vi.fn(
      (_id: number, signal: AbortSignal) =>
        new Promise<Uint8Array>((_resolve, reject) => {
          capturedSignal = signal;
          signal.addEventListener("abort", () => reject(new Error("aborted")));
          // never resolves on its own — must be aborted by the resolver
        }),
    );
    const fallbackReader = vi.fn().mockResolvedValue(fallbackBytes);

    const result = await resolveQuestionAudio({
      questionId: 2,
      ttsFetch,
      fallbackReader,
      timeoutMs: 50,
    });

    expect(result.source).toBe("fallback");
    expect(result.bytes).toBe(fallbackBytes);
    expect(fallbackReader).toHaveBeenCalledWith(2);
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("falls back immediately when ttsFetch rejects (no need to wait for the timeout)", async () => {
    const ttsFetch = vi.fn().mockRejectedValue(new Error("TTS 500"));
    const fallbackReader = vi.fn().mockResolvedValue(fallbackBytes);

    const started = Date.now();
    const result = await resolveQuestionAudio({
      questionId: 3,
      ttsFetch,
      fallbackReader,
      timeoutMs: 5000,
    });
    const elapsed = Date.now() - started;

    expect(result.source).toBe("fallback");
    expect(result.bytes).toBe(fallbackBytes);
    expect(elapsed).toBeLessThan(500); // way under timeoutMs
  });
});
