export const DEEPGRAM_LISTEN_PATH = "wss://api.deepgram.com/v1/listen";

export function deepgramListenQuery(): URLSearchParams {
  return new URLSearchParams({
    model: "nova-3",
    language: "ja",
    interim_results: "true",
    smart_format: "true",
    encoding: "linear16",
    sample_rate: "16000",
    channels: "1",
    endpointing: "300",
    utterance_end_ms: "1000",
  });
}

export function deepgramListenUrl(): string {
  return `${DEEPGRAM_LISTEN_PATH}?${deepgramListenQuery().toString()}`;
}

export type TranscriptionDelta = {
  kind: "delta";
  itemId: string;
  delta: string;
};

export type TranscriptionCompleted = {
  kind: "completed";
  itemId: string;
  transcript: string;
};

export type ParsedTranscriptionEvent =
  | TranscriptionDelta
  | TranscriptionCompleted;

export function parseDeepgramMessage(
  event: unknown,
): ParsedTranscriptionEvent | null {
  if (typeof event !== "object" || event === null) return null;
  const row = event as Record<string, unknown>;
  if (row.type !== "Results") return null;
  const channel = row.channel;
  if (typeof channel !== "object" || channel === null) return null;
  const alternatives = (channel as { alternatives?: unknown }).alternatives;
  if (!Array.isArray(alternatives) || alternatives.length === 0) return null;
  const first = alternatives[0];
  if (typeof first !== "object" || first === null) return null;
  const transcript = (first as { transcript?: unknown }).transcript;
  if (typeof transcript !== "string" || transcript === "") return null;
  const itemId = typeof row.start === "number" ? String(row.start) : "0";
  if (row.is_final === true) {
    return {
      kind: "completed",
      itemId,
      transcript,
    };
  }
  return { kind: "delta", itemId, delta: transcript };
}

export function closeStreamMessage(): string {
  return JSON.stringify({ type: "CloseStream" });
}

export function keepAliveMessage(): string {
  return JSON.stringify({ type: "KeepAlive" });
}

export function joinJapanese(base: string, next: string): string {
  if (!base) return next;
  if (!next) return base;
  return `${base}${next}`;
}
