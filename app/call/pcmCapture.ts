import { concatFloat32 } from "./pcmAudio";

type ProcessorNode = {
  connect: (destination: unknown) => void;
  disconnect: () => void;
  onaudioprocess:
    | ((event: {
        inputBuffer: { getChannelData: (channel: number) => Float32Array };
      }) => void)
    | null;
};

type GainNodeLike = {
  gain: { value: number };
  connect: (destination: unknown) => void;
};

export type PcmAudioContext = {
  sampleRate: number;
  createMediaStreamSource: (stream: MediaStream) => {
    connect: (node: ProcessorNode) => void;
  };
  createScriptProcessor: (
    bufferSize: number,
    inputChannels: number,
    outputChannels: number,
  ) => ProcessorNode;
  createGain?: () => GainNodeLike;
  destination: unknown;
  resume?: () => Promise<void> | void;
  close: () => Promise<void> | void;
};

export type PcmCapture = {
  sampleRate: number;
  getSamples: () => Float32Array;
  stop: () => void;
};

/**
 * One Web Audio tap on the microphone. Keeps the raw PCM for the delivery
 * WAV and optionally streams each chunk to a caller (the Deepgram socket),
 * so transcription and delivery never use two captures.
 *
 * The ScriptProcessor output is routed through a gain of 0 so the mic is
 * not played back through the speakers.
 */
export async function startPcmCapture({
  getUserMedia = () => navigator.mediaDevices.getUserMedia({ audio: true }),
  AudioContextImpl = (
    globalThis as typeof globalThis & { AudioContext?: new () => PcmAudioContext }
  ).AudioContext,
  onChunk,
}: {
  getUserMedia?: () => Promise<MediaStream>;
  AudioContextImpl?: new () => PcmAudioContext;
  onChunk?: (samples: Float32Array, sampleRate: number) => void;
} = {}): Promise<PcmCapture | null> {
  if (typeof AudioContextImpl !== "function") return null;

  let stream: MediaStream | null = null;
  let context: PcmAudioContext | null = null;
  let processor: ProcessorNode | null = null;
  const chunks: Float32Array[] = [];

  function teardown() {
    processor?.disconnect();
    processor = null;
    void context?.close();
    context = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  try {
    stream = await getUserMedia();
    context = new AudioContextImpl();
    await context.resume?.();
    const sampleRate = context.sampleRate;
    const source = context.createMediaStreamSource(stream);
    // ScriptProcessorNode is deprecated; AudioWorklet is later technical debt.
    processor = context.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      // Copy: ScriptProcessor reuses the same buffer on the next callback.
      chunks.push(new Float32Array(input));
      onChunk?.(input, sampleRate);
    };
    source.connect(processor);
    const mute = context.createGain?.() ?? null;
    if (mute) {
      mute.gain.value = 0;
      processor.connect(mute);
      mute.connect(context.destination);
    } else {
      processor.connect(context.destination);
    }
  } catch {
    teardown();
    return null;
  }

  if (!context) {
    teardown();
    return null;
  }

  return {
    sampleRate: context.sampleRate,
    getSamples: () => concatFloat32(chunks),
    stop: teardown,
  };
}
