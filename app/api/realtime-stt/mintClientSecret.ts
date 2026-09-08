export const TRANSCRIPTION_SESSION = {
  type: "transcription",
  input_audio_format: "pcm16",
  input_audio_transcription: {
    model: "gpt-4o-transcribe",
    language: "ja",
    prompt:
      "Japanese language-school interview answers. Expect polite Japanese, self-introductions, study plans, motivations, education, and future goals.",
  },
  turn_detection: null,
  input_audio_noise_reduction: {
    type: "near_field",
  },
} as const;

export async function mintTranscriptionClientSecret({
  apiKey,
  fetchImpl,
  safetyIdentifier,
}: {
  apiKey: string;
  fetchImpl: typeof fetch;
  safetyIdentifier: string;
}): Promise<{ value: string } | null> {
  const res = await fetchImpl("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": safetyIdentifier,
    },
    body: JSON.stringify({ session: TRANSCRIPTION_SESSION }),
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
  if (typeof row.value === "string") return { value: row.value };
  const nested = row.client_secret;
  if (typeof nested === "object" && nested !== null) {
    const secret = nested as Record<string, unknown>;
    if (typeof secret.value === "string") return { value: secret.value };
  }
  return null;
}
