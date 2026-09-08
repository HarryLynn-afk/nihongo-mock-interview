const GROQ_WHISPER_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";

export async function whisperSpeech({
  audio,
  whisperFetch,
  getSttKey,
  timeoutMs = 8000,
}: {
  audio: Blob;
  whisperFetch: typeof fetch;
  getSttKey: () => string;
  timeoutMs?: number;
}): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "ja");
    form.append(
      "file",
      audio,
      audio.type.includes("mp4") ? "answer.mp4" : "answer.webm",
    );

    const res = await whisperFetch(GROQ_WHISPER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${getSttKey()}` },
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
