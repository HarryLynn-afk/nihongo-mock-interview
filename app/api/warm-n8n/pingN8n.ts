/**
 * Fire-and-forget POST to the n8n webhook URL to warm the workflow.
 * Always resolves without throwing — the caller must be able to trust
 * that a network failure here will never crash the interview.
 */
export async function pingN8n(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  try {
    await fetchImpl(url, { method: "POST" });
  } catch {
    // swallow — this is a warm-up ping, its failure must never propagate
  }
}
