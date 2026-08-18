export type SpeechPayload = {
  transcript: string;
  isFinal: boolean;
};

export type TranscribeResult =
  | { ok: true; payload: SpeechPayload }
  | { ok: false; reason: "no-key" | "wispr-error" };

const WISPR_URL = "https://platform-api.wisprflow.ai/api/v1/dash/api";

export async function transcribeSpeech({
  audioBase64,
  wisprFetch,
  getWisprKey,
}: {
  audioBase64: string;
  wisprFetch: typeof fetch;
  getWisprKey: () => string | undefined;
}): Promise<TranscribeResult> {
  const key = getWisprKey();
  if (!key) {
    return { ok: false, reason: "no-key" };
  }

  try {
    const res = await wisprFetch(WISPR_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio: audioBase64,
        language: ["ja"],
        context: { app: { type: "other" } },
      }),
    });

    if (!res.ok) {
      return { ok: false, reason: "wispr-error" };
    }

    const data = (await res.json()) as { text?: string };
    if (typeof data.text !== "string") {
      return { ok: false, reason: "wispr-error" };
    }

    return {
      ok: true,
      payload: { transcript: data.text, isFinal: true },
    };
  } catch {
    return { ok: false, reason: "wispr-error" };
  }
}
