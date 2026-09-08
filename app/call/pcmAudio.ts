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
