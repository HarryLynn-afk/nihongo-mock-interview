import { describe, expect, it } from "vitest";
import { analyzeAudioClip } from "./analyzeAudioClip";
import { floatToWavBlob } from "./pcmAudio";

function tone(seconds: number, sampleRate = 16_000, amplitude = 0.3): Float32Array {
  const samples = new Float32Array(Math.round(seconds * sampleRate));
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * 220 * i) / sampleRate);
  }
  return samples;
}

describe("analyzeAudioClip", () => {
  it("analyzes a WAV clip without decodeAudioData", async () => {
    const clip = floatToWavBlob(tone(1), 16_000);

    const result = await analyzeAudioClip(clip, "はじめまして");

    expect(result.recordingQuality).toBe("pass");
    expect(result.durationSec).toBe(1);
  });

  it("marks an empty clip as not assessed", async () => {
    const result = await analyzeAudioClip(new Blob(), "はじめまして");

    expect(result.recordingQuality).toBe("notAssessed");
    expect(result.notAssessedReason).toBe("empty");
  });
});
