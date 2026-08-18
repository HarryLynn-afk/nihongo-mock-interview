#!/usr/bin/env node

const REQUIRED_ENV_VARS = [
  "ELEVENLABS_TTS_API_KEY",
  "ELEVENLABS_SCRIBE_API_KEY",
  "GEMINI_TRANSLATE_API_KEY",
  "GEMINI_GRADE_API_KEY",
  "N8N_WEBHOOK_URL",
];

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}
