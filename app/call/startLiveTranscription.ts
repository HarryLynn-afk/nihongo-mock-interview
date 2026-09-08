import { downsampleTo16k, floatToLinear16 } from "./pcmAudio";
import {
  closeStreamMessage,
  deepgramListenUrl,
  joinJapanese,
  parseDeepgramMessage,
  type ParsedTranscriptionEvent,
} from "./transcriptionEvents";

export type LiveTranscriptionSession = {
  stop: () => void;
  commit: () => void;
  getTranscript: () => string;
};

const MAX_LISTEN_MS = 20 * 60 * 1000;

type ProcessorNode = {
  connect: (destination: unknown) => void;
  disconnect: () => void;
  onaudioprocess: ((event: { inputBuffer: { getChannelData: (channel: number) => Float32Array } }) => void) | null;
};

type AudioContextLike = {
  sampleRate: number;
  createMediaStreamSource: (stream: MediaStream) => { connect: (node: ProcessorNode) => void };
  createScriptProcessor: (bufferSize: number, inputChannels: number, outputChannels: number) => ProcessorNode;
  destination: unknown;
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
  let socket: WebSocket | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;

  function getTranscript(): string {
    return joinJapanese(finalized, interim);
  }

  function stopSession() {
    if (maxTimer) clearTimeout(maxTimer);
    processor?.disconnect();
    processor = null;
    void audioContext?.close();
    audioContext = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (socket && socket.readyState === WebSocketImpl.OPEN) {
      socket.close();
    }
    socket = null;
  }

  try {
    socket = new WebSocketImpl(deepgramListenUrl(accessToken));
    socket.binaryType = "arraybuffer";
    stream = await getUserMedia();
    audioContext = new AudioContextImpl();
    const source = audioContext.createMediaStreamSource(stream);
    // ScriptProcessorNode is deprecated; AudioWorklet is later technical debt.
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      if (!socket || socket.readyState !== WebSocketImpl.OPEN) return;
      const input = event.inputBuffer.getChannelData(0);
      const pcm = floatToLinear16(
        downsampleTo16k(input, audioContext?.sampleRate ?? 16000),
      );
      socket.send(pcm);
    };
    source.connect(processor);
    processor.connect(audioContext.destination);

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
  };
}
