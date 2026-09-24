import { CONSENT_VERSION } from "@/lib/content/studyAuth";

export const VISIT_ID_COOKIE = "nihongo_visit_id";
export const VISIT_CONSENT_COOKIE = "nihongo_visit_consented";

function signingMessage(userId: string, visitId: string) {
  return new TextEncoder().encode(`${userId}:${visitId}:${CONSENT_VERSION}`);
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

export async function createVisitConsentProof(
  userId: string,
  visitId: string,
): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, signingMessage(userId, visitId)),
  );
  return btoa(String.fromCharCode(...signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function hasVisitConsent(
  userId: string,
  visitId: string | undefined,
  proof: string | undefined,
): Promise<boolean> {
  if (!visitId || !proof) return false;
  const key = await signingKey();
  if (!key) return false;
  try {
    const base64 = proof.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const signature = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    return crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      signingMessage(userId, visitId),
    );
  } catch {
    return false;
  }
}
