import { describe, expect, it } from "vitest";
import {
  analyzePcm,
  countFillers,
  DELIVERY_NOT_PROFICIENCY,
  japaneseCharCount,
  summarizeDelivery,
} from "./deliverySignals";

function tone(seconds: number, sampleRate = 16_000, amplitude = 0.3): Float32Array {
  const samples = new Float32Array(Math.round(seconds * sampleRate));
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * 220 * i) / sampleRate);
  }
  return samples;
}

function silence(seconds: number, sampleRate = 16_000): Float32Array {
  return new Float32Array(Math.round(seconds * sampleRate));
}

function concat(...parts: Float32Array[]): Float32Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

describe("analyzePcm", () => {
  it("marks near-silence as too quiet", () => {
    const result = analyzePcm({
      samples: silence(2),
      sampleRate: 16_000,
      transcript: "はじめまして",
    });

    expect(result.recordingQuality).toBe("notAssessed");
    expect(result.durationSec).toBeNull();
    expect(result.notAssessedReason).toBe("tooQuiet");
    expect(result.observations[0]).toMatch(/level was too low/i);
  });

  it("marks a clip shorter than 0.4s as too short", () => {
    const result = analyzePcm({
      samples: tone(0.2),
      sampleRate: 16_000,
      transcript: "はい",
    });

    expect(result.notAssessedReason).toBe("tooShort");
    expect(result.observations[0]).toMatch(/shorter than/i);
  });

  it("marks a quiet clip with no voiced frame as no speech", () => {
    // amplitude 0.02 → RMS ≈ 0.014, above the overall quiet floor (0.008)
    // but every 30 ms frame stays below the 0.02 silence floor.
    const result = analyzePcm({
      samples: tone(2, 16_000, 0.02),
      sampleRate: 16_000,
      transcript: "はい",
    });

    expect(result.notAssessedReason).toBe("noSpeech");
    expect(result.observations[0]).toMatch(/no speech/i);
  });

  it("counts long mid-answer pauses and does not call it proficiency", () => {
    const result = analyzePcm({
      samples: concat(tone(0.6), silence(1.8), tone(0.6), silence(1.8), tone(0.6)),
      sampleRate: 16_000,
      transcript: "はじめまして。アウンミンハントです。",
    });

    expect(result.recordingQuality).toBe("pass");
    expect(result.longPauseCount).toBeGreaterThanOrEqual(2);
    expect(result.observations.some((line) => /several long pauses/i.test(line))).toBe(
      true,
    );
    expect(result.observations).toContain(DELIVERY_NOT_PROFICIENCY);
  });

  it("reports duration and speech rate for a clear clip", () => {
    const result = analyzePcm({
      samples: tone(2),
      sampleRate: 16_000,
      transcript: "はじめまして",
    });

    expect(result.recordingQuality).toBe("pass");
    expect(result.durationSec).toBe(2);
    expect(result.speechRateCps).toBeGreaterThan(0);
    expect(result.longPauseCount).toBe(0);
  });
});

describe("countFillers", () => {
  it("counts Japanese filler tokens", () => {
    expect(countFillers("あの、えっと、日本です")).toBe(2);
    expect(japaneseCharCount("はじめまして")).toBe(6);
  });
});

describe("summarizeDelivery", () => {
  it("returns unavailable when there are no spoken answers", () => {
    const session = summarizeDelivery([]);

    expect(session.status).toBe("unavailable");
    expect(session.headline).toBe("Not assessed");
    expect(session.answers).toEqual([]);
  });

  it("returns not assessed when every voice clip fails quality", () => {
    const session = summarizeDelivery([
      {
        questionIndex: 0,
        signal: analyzePcm({
          samples: silence(2),
          sampleRate: 16_000,
          transcript: "はい",
        }),
      },
    ]);

    expect(session.status).toBe("notAssessed");
    expect(session.recordingQuality).toBe("notAssessed");
  });

  it("returns needs practice when a clear clip has several long pauses", () => {
    const signal = analyzePcm({
      samples: concat(tone(0.6), silence(1.8), tone(0.6), silence(1.8), tone(0.6)),
      sampleRate: 16_000,
      transcript: "はじめまして。アウンミンハントです。",
    });
    const session = summarizeDelivery([{ questionIndex: 0, signal }]);

    expect(session.status).toBe("needsPractice");
    expect(session.headline).toBe("Needs practice");
  });
});
