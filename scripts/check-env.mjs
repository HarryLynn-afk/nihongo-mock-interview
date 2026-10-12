#!/usr/bin/env node

import nextEnv from "@next/env";

// `prebuild` runs just before `next build`, so load the same env files the
// build sees: .env.production.local, .env.local, .env.production, .env.
nextEnv.loadEnvConfig(process.cwd(), false);

const REQUIRED_ENV_VARS = [
  "GROQ_GRADE_API_KEY",
];

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}
