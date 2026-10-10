function signingMessage(userId: string, attemptId: string) {
  return new TextEncoder().encode(`study-score:${userId}:${attemptId}`);
}

async function signingKey(): Promise<CryptoKey | null> {
  const secret = process.env.STUDY_VISIT_SIGNING_KEY;
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createStudyAttemptToken(userId: string, attemptId: string) {
  const key = await signingKey();
  if (!key) return null;
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, signingMessage(userId, attemptId)),
  );
  const encoded = btoa(String.fromCharCode(...signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${attemptId}.${encoded}`;
}

export async function readStudyAttemptToken(userId: string, token: string) {
  const split = token.lastIndexOf(".");
  if (split < 1) return null;
  const attemptId = token.slice(0, split);
  const key = await signingKey();
  if (!key) return null;
  try {
    const base64 = token.slice(split + 1).replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const signature = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    return (await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      signingMessage(userId, attemptId),
    ))
      ? attemptId
      : null;
  } catch {
    return null;
  }
}
