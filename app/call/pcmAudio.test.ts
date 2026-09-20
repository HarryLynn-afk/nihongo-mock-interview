import { describe, expect, it } from "vitest";
import {
  audioClipFileName,
  concatFloat32,
  downsampleTo16k,
  floatToLinear16,
  floatToWavBlob,
  wavBlobToPcm,
} from "./pcmAudio";

describe("pcmAudio", () => {
  it("downsamples 48 kHz audio to 16 kHz", () => {
    const input = new Float32Array(480);
    input.fill(0.5);
    const output = downsampleTo16k(input, 48000);
    expect(output.length).toBe(160);
  });

  it("encodes float samples as little-endian PCM16", () => {
    const bytes = new Uint8Array(floatToLinear16(new Float32Array([0, 1, -1])));
    expect(bytes.length).toBe(6);
    expect(bytes[0]).toBe(0);
    expect(bytes[1]).toBe(0);
  });

  it("joins PCM chunks without copying a shared buffer", () => {
    const joined = concatFloat32([
      new Float32Array([0.1, 0.2]),
      new Float32Array([0.3]),
    ]);
    expect(Array.from(joined)).toEqual(Array.from(new Float32Array([0.1, 0.2, 0.3])));
  });

  it("wraps float samples in a mono WAV blob the browser can decode", async () => {
    const blob = floatToWavBlob(new Float32Array([0, 0.5, -0.5]), 16000);
    expect(blob.type).toBe("audio/wav");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe("WAVE");
    expect(blob.size).toBe(44 + 6);
  });

  it("round-trips a WAV blob back to float samples", async () => {
    const original = new Float32Array([0, 0.5, -0.5]);
    const parsed = wavBlobToPcm(await floatToWavBlob(original, 16000).arrayBuffer());
    expect(parsed?.sampleRate).toBe(16000);
    expect(parsed?.samples.length).toBe(3);
    expect(parsed?.samples[1]).toBeCloseTo(0.5, 3);
    expect(parsed?.samples[2]).toBeCloseTo(-0.5, 3);
  });

  it("names the Whisper upload from the clip MIME type", () => {
    expect(audioClipFileName("audio/wav")).toBe("answer.wav");
    expect(audioClipFileName("audio/mp4")).toBe("answer.mp4");
    expect(audioClipFileName("audio/webm;codecs=opus")).toBe("answer.webm");
  });
});
