import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const SCRIPT_PATH = path.resolve(__dirname, "check-env.mjs");

function runCheckEnv(env: Record<string, string | undefined>) {
  return spawnSync("node", [SCRIPT_PATH], {
    encoding: "utf-8",
    env: { PATH: process.env.PATH, ...env },
  });
}

const ALL_REQUIRED_ENV = {
  GROQ_GRADE_API_KEY: "test-key",
};

describe("scripts/check-env.mjs", () => {
  it("exits non-zero and names the missing var when a required key is absent", () => {
    const envWithoutGradeKey: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutGradeKey.GROQ_GRADE_API_KEY;

    const result = runCheckEnv(envWithoutGradeKey);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/GROQ_GRADE_API_KEY/);
  });

  it("exits zero when all required keys are present", () => {
    const result = runCheckEnv(ALL_REQUIRED_ENV);

    expect(result.status).toBe(0);
  });

  it("does not require RESEARCH_FORM_URL", () => {
    const result = runCheckEnv(ALL_REQUIRED_ENV);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/RESEARCH_FORM_URL/);
  });

  it("does not require GROQ_TRANSLATE_API_KEY", () => {
    const envWithoutTranslate: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutTranslate.GROQ_TRANSLATE_API_KEY;

    const result = runCheckEnv(envWithoutTranslate);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/GROQ_TRANSLATE_API_KEY/);
  });

  it("does not require ELEVENLABS_TTS_API_KEY", () => {
    const envWithoutTts: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutTts.ELEVENLABS_TTS_API_KEY;

    const result = runCheckEnv(envWithoutTts);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/ELEVENLABS_TTS_API_KEY/);
  });

  it("does not require ELEVENLABS_SCRIBE_API_KEY", () => {
    const envWithoutScribe: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutScribe.ELEVENLABS_SCRIBE_API_KEY;

    const result = runCheckEnv(envWithoutScribe);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/ELEVENLABS_SCRIBE_API_KEY/);
  });

  it("does not require WISPR_API_KEY", () => {
    const envWithoutWispr: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutWispr.WISPR_API_KEY;

    const result = runCheckEnv(envWithoutWispr);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/WISPR_API_KEY/);
  });

  it("does not require PITCH_ACCESS_KEY", () => {
    const envWithoutPitch: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutPitch.PITCH_ACCESS_KEY;

    const result = runCheckEnv(envWithoutPitch);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/PITCH_ACCESS_KEY/);
  });

  it("does not require GROQ_STT_API_KEY", () => {
    const envWithoutStt: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutStt.GROQ_STT_API_KEY;

    const result = runCheckEnv(envWithoutStt);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/GROQ_STT_API_KEY/);
  });

  it("does not require DEEPGRAM_STT_API_KEY or Supabase", () => {
    const result = runCheckEnv(ALL_REQUIRED_ENV);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/DEEPGRAM_STT_API_KEY/);
    expect(result.stderr).not.toMatch(/SUPABASE/);
  });
});
