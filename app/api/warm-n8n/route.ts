import { getN8nWebhookUrl } from "@/lib/server/env/n8n";
import { pingN8n } from "./pingN8n";

/**
 * Called by the client immediately on Join to warm the n8n grading
 * workflow before Q3 finishes. Fire-and-forget: we return 202 the
 * moment the ping is scheduled, without waiting for n8n to respond.
 */
export async function POST() {
  // Intentionally not awaited — return early so the client isn't blocked.
  void pingN8n(getN8nWebhookUrl());
  return new Response(null, { status: 202 });
}
