export const DEEPGRAM_GRANT_URL = "https://api.deepgram.com/v1/auth/grant";
export const LISTEN_TTL_SECONDS = 300;

export async function mintDeepgramListenToken({
  apiKey,
  fetchImpl,
}: {
  apiKey: string;
  fetchImpl: typeof fetch;
}): Promise<{ accessToken: string } | null> {
  const res = await fetchImpl(DEEPGRAM_GRANT_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl_seconds: LISTEN_TTL_SECONDS }),
  });
  if (!res.ok) return null;
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const row = data as Record<string, unknown>;
  if (typeof row.access_token === "string") {
    return { accessToken: row.access_token };
  }
  if (typeof row.token === "string") {
    return { accessToken: row.token };
  }
  return null;
}
