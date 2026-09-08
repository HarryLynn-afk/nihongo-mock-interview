import { describe, expect, it } from "vitest";
import {
  commitAudioBufferMessage,
  parseTranscriptionEvent,
} from "./transcriptionEvents";

describe("transcriptionEvents", () => {
  it("parses live delta and completed transcript events", () => {
    expect(
      parseTranscriptionEvent({
        type: "conversation.item.input_audio_transcription.delta",
        item_id: "item_1",
        delta: "はじめまして",
      }),
    ).toEqual({ kind: "delta", itemId: "item_1", delta: "はじめまして" });

    expect(
      parseTranscriptionEvent({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "item_1",
        transcript: "はじめまして。",
      }),
    ).toEqual({
      kind: "completed",
      itemId: "item_1",
      transcript: "はじめまして。",
    });
  });

  it("builds the manual commit message used on Submit", () => {
    expect(JSON.parse(commitAudioBufferMessage())).toEqual({
      type: "input_audio_buffer.commit",
    });
  });
});
