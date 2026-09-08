import { describe, expect, it, vi } from "vitest";
import {
  TRANSCRIPTION_SESSION,
  mintTranscriptionClientSecret,
} from "./mintClientSecret";

describe("mintTranscriptionClientSecret", () => {
  it("POSTs a transcription session and returns only the ephemeral value", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ value: "ek_test" }),
    });

    const result = await mintTranscriptionClientSecret({
      apiKey: "sk-never-to-client",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      safetyIdentifier: "guest-hash",
    });

    expect(result).toEqual({ value: "ek_test" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.openai.com/v1/realtime/client_secrets",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-never-to-client",
          "OpenAI-Safety-Identifier": "guest-hash",
        }),
      }),
    );
    const body = JSON.parse(
      (fetchImpl.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.session).toMatchObject({
      type: TRANSCRIPTION_SESSION.type,
      turn_detection: null,
      input_audio_transcription: {
        model: "gpt-4o-transcribe",
        language: "ja",
      },
    });
  });

  it("returns null when OpenAI misses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope" }),
    });

    await expect(
      mintTranscriptionClientSecret({
        apiKey: "sk-x",
        fetchImpl: fetchImpl as unknown as typeof fetch,
        safetyIdentifier: "id",
      }),
    ).resolves.toBeNull();
  });
});
