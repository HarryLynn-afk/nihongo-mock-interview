import { requireEnv } from "./requireEnv";

const N8N_WEBHOOK_URL = requireEnv("N8N_WEBHOOK_URL");

export function getN8nWebhookUrl(): string {
  return N8N_WEBHOOK_URL;
}
