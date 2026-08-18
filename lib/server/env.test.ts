import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setAllRequiredEnv() {
  process.env.ELEVENLABS_TTS_API_KEY = "test-elevenlabs-tts-key";
  process.env.ELEVENLABS_SCRIBE_API_KEY = "test-elevenlabs-scribe-key";
  process.env.GEMINI_TRANSLATE_API_KEY = "test-gemini-translate-key";
  process.env.GEMINI_GRADE_API_KEY = "test-gemini-grade-key";
  process.env.N8N_WEBHOOK_URL = "https://example.com/webhook";
}

describe("lib/server/env", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws at import time when a required key is missing", async () => {
    setAllRequiredEnv();
    delete process.env.GEMINI_GRADE_API_KEY;

    await expect(import("./env")).rejects.toThrow(/GEMINI_GRADE_API_KEY/);
  });

  it("keeps each provider key scoped to its own getter — TTS and Scribe never return the same value", async () => {
    setAllRequiredEnv();

    const { getElevenLabsTtsKey, getElevenLabsScribeKey, getGeminiTranslateKey, getGeminiGradeKey } =
      await import("./env");

    expect(getElevenLabsTtsKey()).toBe("test-elevenlabs-tts-key");
    expect(getElevenLabsScribeKey()).toBe("test-elevenlabs-scribe-key");
    expect(getGeminiTranslateKey()).toBe("test-gemini-translate-key");
    expect(getGeminiGradeKey()).toBe("test-gemini-grade-key");
  });
});
