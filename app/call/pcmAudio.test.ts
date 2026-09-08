import { describe, expect, it } from "vitest";
import { downsampleTo16k, floatToLinear16 } from "./pcmAudio";

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
});
