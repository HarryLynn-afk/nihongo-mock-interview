function signingMessage(userId: string, attemptId: string) {
  return new TextEncoder().encode(`study-score:${userId}:${attemptId}`);
}

export type StudySessionAnswer = {
  questionIndex: number;
  questionId: number;
  status: "answered" | "skipped";
  transcript: string;
  pushbackCount: 0 | 1 | 2;
  isFollowUp: boolean;
};

type SavePayload = {
  userId: string;
  attemptId: string;
  report: import("@/lib/content/sampleReport").InterviewReport;
  answers: StudySessionAnswer[];
};

function encode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function decode(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

export async function createStudySaveReceipt(payload: SavePayload): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const encodedPayload = encode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(`study-save:${encodedPayload}`),
  ));
  return `${encodedPayload}.${encode(signature)}`;
}

export async function readStudySaveReceipt(userId: string, receipt: string): Promise<SavePayload | null> {
  const split = receipt.lastIndexOf(".");
  const key = await signingKey();
  if (split < 1 || !key) return null;
  try {
    const encodedPayload = receipt.slice(0, split);
    const valid = await crypto.subtle.verify(
      "HMAC", key, decode(receipt.slice(split + 1)),
      new TextEncoder().encode(`study-save:${encodedPayload}`),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode(encodedPayload))) as SavePayload;
    return payload.userId === userId ? payload : null;
  } catch {
    return null;
  }
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
