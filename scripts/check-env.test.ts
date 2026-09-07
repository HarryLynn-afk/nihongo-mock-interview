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
  ELEVENLABS_TTS_API_KEY: "test-key",
  ELEVENLABS_SCRIBE_API_KEY: "test-key",
  GROQ_TRANSLATE_API_KEY: "test-key",
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

  it("does not require N8N_WEBHOOK_URL", () => {
    const envWithoutN8n: Record<string, string | undefined> = {
      ...ALL_REQUIRED_ENV,
    };
    delete envWithoutN8n.N8N_WEBHOOK_URL;

    const result = runCheckEnv(envWithoutN8n);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/N8N_WEBHOOK_URL/);
  });
});
