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

describe("scripts/check-env.mjs", () => {
  it("exits non-zero and names the missing var when a required key is absent", () => {
    const result = runCheckEnv({
      ELEVENLABS_API_KEY: "test-key",
      N8N_WEBHOOK_URL: "https://example.com/webhook",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/GEMINI_API_KEY/);
  });

  it("exits zero when all required keys are present", () => {
    const result = runCheckEnv({
      ELEVENLABS_API_KEY: "test-key",
      GEMINI_API_KEY: "test-key",
      N8N_WEBHOOK_URL: "https://example.com/webhook",
    });

    expect(result.status).toBe(0);
  });
});
