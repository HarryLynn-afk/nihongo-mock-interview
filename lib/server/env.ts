function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const ELEVENLABS_API_KEY = requireEnv("ELEVENLABS_API_KEY");
const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY");
const N8N_WEBHOOK_URL = requireEnv("N8N_WEBHOOK_URL");
const WISPR_API_KEY = process.env.WISPR_API_KEY;

export function getElevenLabsKey(): string {
  return ELEVENLABS_API_KEY;
}

export function getGeminiKey(): string {
  return GEMINI_API_KEY;
}

export function getN8nWebhookUrl(): string {
  return N8N_WEBHOOK_URL;
}

export function getWisprKey(): string | undefined {
  return WISPR_API_KEY;
}
