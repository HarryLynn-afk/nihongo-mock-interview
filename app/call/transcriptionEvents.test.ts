import { describe, expect, it } from "vitest";
import {
  closeStreamMessage,
  deepgramListenUrl,
  joinJapanese,
  parseDeepgramMessage,
} from "./transcriptionEvents";

describe("Deepgram live transcript helpers", () => {
  it("builds a Nova-3 Japanese listen URL that uses the ephemeral token", () => {
    const url = new URL(deepgramListenUrl("dg-temp"));
    expect(url.protocol).toBe("wss:");
    expect(url.hostname).toBe("api.deepgram.com");
    expect(url.searchParams.get("model")).toBe("nova-3");
    expect(url.searchParams.get("language")).toBe("ja");
    expect(url.searchParams.get("encoding")).toBe("linear16");
    expect(url.searchParams.get("sample_rate")).toBe("16000");
    expect(url.searchParams.get("token")).toBe("dg-temp");
  });

  it("parses interim and final Results without empty transcripts", () => {
    expect(
      parseDeepgramMessage({
        type: "Results",
        is_final: false,
        start: 0.2,
        channel: { alternatives: [{ transcript: "はじめ" }] },
      }),
    ).toEqual({ kind: "delta", itemId: "0.2", delta: "はじめ" });

    expect(
      parseDeepgramMessage({
        type: "Results",
        is_final: true,
        start: 0.2,
        channel: { alternatives: [{ transcript: "はじめまして。" }] },
      }),
    ).toEqual({
      kind: "completed",
      itemId: "0.2",
      transcript: "はじめまして。",
    });

    expect(
      parseDeepgramMessage({
        type: "Results",
        is_final: true,
        channel: { alternatives: [{ transcript: "" }] },
      }),
    ).toBeNull();
  });

  it("joins Japanese without inserting spaces", () => {
    expect(joinJapanese("はじめ", "まして。")).toBe("はじめまして。");
  });

  it("builds CloseStream for Submit", () => {
    expect(JSON.parse(closeStreamMessage())).toEqual({ type: "CloseStream" });
  });
});
