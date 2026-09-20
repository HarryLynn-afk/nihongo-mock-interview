import { concatFloat32, downsampleTo16k, floatToLinear16 } from "./pcmAudio";
import {
  closeStreamMessage,
  deepgramListenUrl,
  joinJapanese,
  parseDeepgramMessage,
  type ParsedTranscriptionEvent,
} from "./transcriptionEvents";

export type LivePcmCapture = {
  samples: Float32Array;
  sampleRate: number;
};

export type LiveTranscriptionSession = {
  stop: () => void;
  commit: () => void;
  getTranscript: () => string;
  getPcm: () => LivePcmCapture;
};

const MAX_LISTEN_MS = 20 * 60 * 1000;
const OPEN_WAIT_MS = 3000;

function waitForListenOpen(
  socket: WebSocket,
  WebSocketImpl: typeof WebSocket,
): Promise<boolean> {
  if (socket.readyState === WebSocketImpl.OPEN) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => finish(false), OPEN_WAIT_MS);
    function finish(ok: boolean) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    }
    socket.addEventListener("open", () => finish(true));
    socket.addEventListener("error", () => finish(false));
    socket.addEventListener("close", () => finish(false));
  });
}

type ProcessorNode = {
  connect: (destination: unknown) => void;
  disconnect: () => void;
  onaudioprocess: ((event: { inputBuffer: { getChannelData: (channel: number) => Float32Array } }) => void) | null;
};

type GainNodeLike = {
  gain: { value: number };
  connect: (destination: unknown) => void;
};

type AudioContextLike = {
  sampleRate: number;
  createMediaStreamSource: (stream: MediaStream) => { connect: (node: ProcessorNode) => void };
  createScriptProcessor: (bufferSize: number, inputChannels: number, outputChannels: number) => ProcessorNode;
  createGain?: () => GainNodeLike;
  destination: unknown;
  resume?: () => Promise<void> | void;
  close: () => Promise<void> | void;
};

export async function startLiveTranscriptionSession({
  onEvent,
  fetchImpl = fetch,
  getUserMedia = () => navigator.mediaDevices.getUserMedia({ audio: true }),
  WebSocketImpl = globalThis.WebSocket,
  AudioContextImpl = (
    globalThis as typeof globalThis & { AudioContext?: new () => AudioContextLike }
  ).AudioContext,
}: {
  onEvent: (event: ParsedTranscriptionEvent) => void;
  fetchImpl?: typeof fetch;
  getUserMedia?: () => Promise<MediaStream>;
  WebSocketImpl?: typeof WebSocket;
  AudioContextImpl?: new () => AudioContextLike;
}): Promise<LiveTranscriptionSession | null> {
  if (typeof WebSocketImpl !== "function" || typeof AudioContextImpl !== "function") {
    return null;
  }

  const tokenRes = await fetchImpl("/api/deepgram-stt", { method: "POST" });
  if (!tokenRes.ok) return null;
  let tokenBody: unknown;
  try {
    tokenBody = await tokenRes.json();
  } catch {
    return null;
  }
  if (typeof tokenBody !== "object" || tokenBody === null) return null;
  const accessToken = (tokenBody as { accessToken?: unknown }).accessToken;
  if (typeof accessToken !== "string") return null;

  let finalized = "";
  let interim = "";
  let stream: MediaStream | null = null;
  let audioContext: AudioContextLike | null = null;
  let processor: ProcessorNode | null = null;
  let mute: GainNodeLike | null = null;
  let socket: WebSocket | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;
  const pcmChunks: Float32Array[] = [];
  let pcmSampleRate = 16000;

  function getTranscript(): string {
    return joinJapanese(finalized, interim);
  }

  function getPcm(): LivePcmCapture {
    return {
      samples: concatFloat32(pcmChunks),
      sampleRate: pcmSampleRate,
    };
  }

  function stopSession() {
    if (maxTimer) clearTimeout(maxTimer);
    processor?.disconnect();
    processor = null;
    mute = null;
    void audioContext?.close();
    audioContext = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (socket) {
      socket.close();
    }
    socket = null;
  }

  try {
    // Two protocols: a space in one string is an invalid Sec-WebSocket-Protocol.
    socket = new WebSocketImpl(deepgramListenUrl(), ["bearer", accessToken]);
    socket.binaryType = "arraybuffer";
    const opened = await waitForListenOpen(socket, WebSocketImpl);
    if (!opened) {
      stopSession();
      return null;
    }
    stream = await getUserMedia();
    audioContext = new AudioContextImpl();
    await audioContext.resume?.();
    const source = audioContext.createMediaStreamSource(stream);
    // ScriptProcessorNode is deprecated; AudioWorklet is later technical debt.
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    pcmSampleRate = audioContext.sampleRate;
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      // Copy: ScriptProcessor reuses the same buffer on the next callback.
      pcmChunks.push(new Float32Array(input));
      if (!socket || socket.readyState !== WebSocketImpl.OPEN) return;
      const pcm = floatToLinear16(
        downsampleTo16k(input, audioContext?.sampleRate ?? 16000),
      );
      socket.send(pcm);
    };
    source.connect(processor);
    // Keep the graph alive without playing the mic through the speakers.
    // An unmuted tap into destination can silence a second MediaRecorder
    // via echo cancellation; delivery now uses this PCM, not that recorder.
    mute = audioContext.createGain?.() ?? null;
    if (mute) {
      mute.gain.value = 0;
      processor.connect(mute);
      mute.connect(audioContext.destination);
    } else {
      processor.connect(audioContext.destination);
    }

    socket.addEventListener("message", (event: MessageEvent<string | ArrayBuffer>) => {
      if (typeof event.data !== "string") return;
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(event.data);
      } catch {
        return;
      }
      const parsed = parseDeepgramMessage(parsedJson);
      if (!parsed) return;
      if (parsed.kind === "delta") {
        interim = parsed.delta;
      } else {
        finalized = joinJapanese(finalized, parsed.transcript);
        interim = "";
      }
      onEvent(parsed);
    });

    maxTimer = setTimeout(() => {
      stopSession();
    }, MAX_LISTEN_MS);
  } catch {
    stopSession();
    return null;
  }

  return {
    stop: stopSession,
    commit: () => {
      if (socket && socket.readyState === WebSocketImpl.OPEN) {
        socket.send(closeStreamMessage());
      }
    },
    getTranscript,
    getPcm,
  };
}
