import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setAllRequiredEnv() {
  process.env.ELEVENLABS_API_KEY = "test-elevenlabs-key";
  process.env.GEMINI_API_KEY = "test-gemini-key";
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
    delete process.env.GEMINI_API_KEY;

    await expect(import("./env")).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
