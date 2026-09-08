#!/usr/bin/env node

const REQUIRED_ENV_VARS = [
  "ELEVENLABS_TTS_API_KEY",
  "GROQ_TRANSLATE_API_KEY",
  "GROQ_GRADE_API_KEY",
  "GROQ_STT_API_KEY",
];

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}
