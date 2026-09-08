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

export function parseTranscriptionEvent(
  event: unknown,
): ParsedTranscriptionEvent | null {
  if (typeof event !== "object" || event === null) return null;
  const row = event as Record<string, unknown>;
  if (typeof row.item_id !== "string") return null;
  if (row.type === "conversation.item.input_audio_transcription.delta") {
    if (typeof row.delta !== "string") return null;
    return { kind: "delta", itemId: row.item_id, delta: row.delta };
  }
  if (row.type === "conversation.item.input_audio_transcription.completed") {
    if (typeof row.transcript !== "string") return null;
    return {
      kind: "completed",
      itemId: row.item_id,
      transcript: row.transcript,
    };
  }
  return null;
}

export function commitAudioBufferMessage(): string {
  return JSON.stringify({ type: "input_audio_buffer.commit" });
}
