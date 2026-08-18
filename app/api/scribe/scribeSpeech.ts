const SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export async function scribeSpeech({
  audioBytes,
  scribeFetch,
  getScribeKey,
  timeoutMs = 8000,
}: {
  audioBytes: Uint8Array;
  scribeFetch: typeof fetch;
  getScribeKey: () => string;
  timeoutMs?: number;
}): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append("model_id", "scribe_v1");
    form.append("language_code", "ja");
    form.append(
      "file",
      new Blob([audioBytes], { type: "audio/webm" }),
      "answer.webm",
    );

    const res = await scribeFetch(SCRIBE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "xi-api-key": getScribeKey() },
      body: form,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    const text = data.text?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
