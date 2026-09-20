export const TARGET_SAMPLE_RATE = 16000;

export function downsampleTo16k(
  input: Float32Array,
  inputRate: number,
): Float32Array {
  if (inputRate === TARGET_SAMPLE_RATE) return input;
  if (inputRate <= 0) return new Float32Array(0);
  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const length = Math.floor(input.length / ratio);
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    output[index] = input[Math.floor(index * ratio)] ?? 0;
  }
  return output;
}

export function floatToLinear16(input: Float32Array): ArrayBuffer {
  const bytes = new ArrayBuffer(input.length * 2);
  const view = new DataView(bytes);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(index * 2, int16, true);
  }
  return bytes;
}

export function concatFloat32(chunks: readonly Float32Array[]): Float32Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  return samples;
}

export function audioClipFileName(mimeType: string): string {
  if (mimeType.includes("wav")) return "answer.wav";
  if (mimeType.includes("mp4")) return "answer.mp4";
  return "answer.webm";
}

export function floatToWavBlob(
  samples: Float32Array,
  sampleRate: number,
): Blob {
  const pcm = floatToLinear16(samples);
  const dataSize = pcm.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  function writeAscii(offset: number, text: string) {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  }
  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);
  bytes.set(new Uint8Array(pcm), 44);
  return new Blob([buffer], { type: "audio/wav" });
}

export function wavBlobToPcm(
  buffer: ArrayBuffer,
): { samples: Float32Array; sampleRate: number } | null {
  if (buffer.byteLength < 44) return null;
  const view = new DataView(buffer);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  const wave = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11),
  );
  if (riff !== "RIFF" || wave !== "WAVE") return null;
  const sampleRate = view.getUint32(24, true);
  const bits = view.getUint16(34, true);
  if (bits !== 16 || sampleRate <= 0) return null;
  const dataSize = view.getUint32(40, true);
  const sampleCount = Math.floor(dataSize / 2);
  if (44 + sampleCount * 2 > buffer.byteLength) return null;
  const samples = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    const int16 = view.getInt16(44 + index * 2, true);
    samples[index] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }
  return { samples, sampleRate };
}
