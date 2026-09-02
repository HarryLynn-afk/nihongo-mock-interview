import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const ALL_KEYS = {
  ELEVENLABS_TTS_API_KEY: "test-elevenlabs-tts-key",
  ELEVENLABS_SCRIBE_API_KEY: "test-elevenlabs-scribe-key",
  GROQ_GRADE_API_KEY: "test-groq-grade-key",
  GROQ_TRANSLATE_API_KEY: "test-groq-translate-key",
  N8N_WEBHOOK_URL: "https://example.com/webhook",
} as const;

function setAllRequiredEnv() {
  Object.assign(process.env, ALL_KEYS);
}

describe("lib/server/env/* per-purpose modules", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("each getter returns its own scoped value (TTS ≠ Scribe ≠ Translate ≠ Grade)", async () => {
    setAllRequiredEnv();

    const { getElevenLabsTtsKey } = await import("./elevenlabsTts");
    const { getElevenLabsScribeKey } = await import("./elevenlabsScribe");
    const { getGroqTranslateKey } = await import("./groqTranslate");
    const { getGroqGradeKey } = await import("./groqGrade");
    const { getN8nWebhookUrl } = await import("./n8n");

    expect(getElevenLabsTtsKey()).toBe(ALL_KEYS.ELEVENLABS_TTS_API_KEY);
    expect(getElevenLabsScribeKey()).toBe(ALL_KEYS.ELEVENLABS_SCRIBE_API_KEY);
    expect(getGroqTranslateKey()).toBe(ALL_KEYS.GROQ_TRANSLATE_API_KEY);
    expect(getGroqGradeKey()).toBe(ALL_KEYS.GROQ_GRADE_API_KEY);
    expect(getN8nWebhookUrl()).toBe(ALL_KEYS.N8N_WEBHOOK_URL);
  });

  // The whole reason we split env.ts into per-purpose modules: a missing
  // Scribe key must not break /api/tts, /api/warm-n8n, /api/translate,
  // etc. Each module's fail-fast must be scoped to only itself.
  it.each([
    {
      missing: "ELEVENLABS_SCRIBE_API_KEY",
      failingImport: "./elevenlabsScribe",
      unrelatedImport: "./elevenlabsTts",
    },
    {
      missing: "ELEVENLABS_TTS_API_KEY",
      failingImport: "./elevenlabsTts",
      unrelatedImport: "./n8n",
    },
    {
      missing: "GROQ_TRANSLATE_API_KEY",
      failingImport: "./groqTranslate",
      unrelatedImport: "./groqGrade",
    },
    {
      missing: "GROQ_GRADE_API_KEY",
      failingImport: "./groqGrade",
      unrelatedImport: "./groqTranslate",
    },
    {
      missing: "N8N_WEBHOOK_URL",
      failingImport: "./n8n",
      unrelatedImport: "./elevenlabsTts",
    },
  ])(
    "$missing missing → $failingImport throws, but $unrelatedImport still imports",
    async ({ missing, failingImport, unrelatedImport }) => {
      setAllRequiredEnv();
      delete process.env[missing];

      await expect(import(failingImport)).rejects.toThrow(new RegExp(missing));
      // key invariant: the unrelated module is not coupled to the missing key
      await expect(import(unrelatedImport)).resolves.toBeDefined();
    },
  );

  it("Wispr key is optional — its module imports cleanly even when the var is absent", async () => {
    setAllRequiredEnv();
    delete process.env.WISPR_API_KEY;

    const { getWisprKey } = await import("./wispr");
    expect(getWisprKey()).toBeUndefined();
  });

  it("research form URL is optional — missing var returns null and does not throw", async () => {
    setAllRequiredEnv();
    delete process.env.RESEARCH_FORM_URL;

    const { getResearchFormUrl } = await import("./researchForm");
    expect(getResearchFormUrl()).toBeNull();
  });

  it("research form URL getter returns the URL when set", async () => {
    setAllRequiredEnv();
    process.env.RESEARCH_FORM_URL =
      "https://docs.google.com/forms/d/e/test/formResponse";

    const { getResearchFormUrl } = await import("./researchForm");
    expect(getResearchFormUrl()).toBe(
      "https://docs.google.com/forms/d/e/test/formResponse",
    );
  });
});
