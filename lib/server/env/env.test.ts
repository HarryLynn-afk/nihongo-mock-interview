import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const ALL_KEYS = {
  GROQ_GRADE_API_KEY: "test-groq-grade-key",
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

  it("the Groq getter returns its scoped value", async () => {
    setAllRequiredEnv();

    const { getGroqGradeKey } = await import("./groqGrade");

    expect(getGroqGradeKey()).toBe(ALL_KEYS.GROQ_GRADE_API_KEY);
  });

  it("a missing required key throws at its import, but optional modules still import", async () => {
    setAllRequiredEnv();
    delete process.env.GROQ_GRADE_API_KEY;

    await expect(import("./groqGrade")).rejects.toThrow(/GROQ_GRADE_API_KEY/);
    await expect(import("./deepgramStt")).resolves.toBeDefined();
  });

  it("Deepgram STT key is optional — missing var does not throw", async () => {
    setAllRequiredEnv();
    delete process.env.DEEPGRAM_STT_API_KEY;

    const { getDeepgramSttKey } = await import("./deepgramStt");
    expect(getDeepgramSttKey()).toBeUndefined();
  });

  it("Supabase env is optional — missing vars do not throw", async () => {
    setAllRequiredEnv();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { isSupabaseConfigured, getSupabaseUrl } = await import("./supabase");
    expect(getSupabaseUrl()).toBeNull();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("DeepSeek grade key is optional — missing var returns null and does not throw", async () => {
    setAllRequiredEnv();
    delete process.env.DEEPSEEK_GRADE_API_KEY;

    const { getDeepseekGradeKey } = await import("./deepseekGrade");
    expect(getDeepseekGradeKey()).toBeNull();
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
