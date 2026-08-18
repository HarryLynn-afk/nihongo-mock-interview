import { describe, expect, it, vi } from "vitest";
import { transcribeSpeech } from "./transcribeSpeech";

describe("transcribeSpeech", () => {
  it("returns no-key without calling Wispr when the Wispr key is missing", async () => {
    const wisprFetch = vi.fn();

    const result = await transcribeSpeech({
      audioBase64: "dGVzdA==",
      wisprFetch,
      getWisprKey: () => undefined,
    });

    expect(result).toEqual({ ok: false, reason: "no-key" });
    expect(wisprFetch).not.toHaveBeenCalled();
  });

  it("maps a Wispr text response onto the shared SpeechPayload shape", async () => {
    const wisprFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "はじめまして。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await transcribeSpeech({
      audioBase64: "dGVzdA==",
      wisprFetch,
      getWisprKey: () => "test-wispr-key",
    });

    expect(wisprFetch).toHaveBeenCalledWith(
      "https://platform-api.wisprflow.ai/api/v1/dash/api",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-wispr-key",
        }),
      }),
    );
    expect(result).toEqual({
      ok: true,
      payload: { transcript: "はじめまして。", isFinal: true },
    });
  });

  it("returns wispr-error when Wispr fetch rejects", async () => {
    const wisprFetch = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await transcribeSpeech({
      audioBase64: "dGVzdA==",
      wisprFetch,
      getWisprKey: () => "test-wispr-key",
    });

    expect(result).toEqual({ ok: false, reason: "wispr-error" });
  });
});
