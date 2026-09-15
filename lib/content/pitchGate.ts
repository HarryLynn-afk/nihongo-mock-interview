/**
 * Pitch-mode gate helpers. Cookie HMAC and path checks only — the secret
 * itself lives in `lib/server/env/pitchAccess.ts` and is never imported
 * by a client component.
 */
export const PITCH_GATE_COOKIE = "nihongo_pitch_gate";

const PITCH_GATE_PAYLOAD = "pitch-ok";

export function isPitchCallPath(pathname: string, search: string): boolean {
  if (pathname !== "/call") return false;
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("pitch") === "1";
}

export async function signPitchGateToken(secret: string): Promise<string> {
  return hmacHex(secret, PITCH_GATE_PAYLOAD);
}

export async function pitchGateIsOpen(
  cookieValue: string | undefined,
  secret: string | null,
): Promise<boolean> {
  if (!secret || !cookieValue) return false;
  const expected = await signPitchGateToken(secret);
  return safeEqualHex(cookieValue, expected);
}

export async function accessKeysMatch(
  provided: string,
  expected: string,
): Promise<boolean> {
  const providedMac = await hmacHex(expected, provided);
  const expectedMac = await hmacHex(expected, expected);
  return safeEqualHex(providedMac, expectedMac);
}

export async function pitchCallRedirectPath(
  pathname: string,
  search: string,
  cookieValue: string | undefined,
  secret: string | null,
): Promise<"/pitch" | null> {
  if (!isPitchCallPath(pathname, search)) return null;
  const open = await pitchGateIsOpen(cookieValue, secret);
  return open ? null : "/pitch";
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  if (!/^[0-9a-f]+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBytes = hexToBytes(left);
  const rightBytes = hexToBytes(right);
  if (!leftBytes || !rightBytes || leftBytes.length !== rightBytes.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < leftBytes.length; i += 1) {
    diff |= leftBytes[i] ^ rightBytes[i];
  }
  return diff === 0;
}
