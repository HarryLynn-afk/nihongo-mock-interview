import { downsampleTo16k, floatToLinear16 } from "./pcmAudio";
import { startPcmCapture, type PcmAudioContext, type PcmCapture } from "./pcmCapture";
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

export async function startLiveTranscriptionSession({
  onEvent,
  fetchImpl = fetch,
  getUserMedia = () => navigator.mediaDevices.getUserMedia({ audio: true }),
  WebSocketImpl = globalThis.WebSocket,
  AudioContextImpl = (
    globalThis as typeof globalThis & { AudioContext?: new () => PcmAudioContext }
  ).AudioContext,
}: {
  onEvent: (event: ParsedTranscriptionEvent) => void;
  fetchImpl?: typeof fetch;
  getUserMedia?: () => Promise<MediaStream>;
  WebSocketImpl?: typeof WebSocket;
  AudioContextImpl?: new () => PcmAudioContext;
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
  let capture: PcmCapture | null = null;
  let socket: WebSocket | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;

  function getTranscript(): string {
    return joinJapanese(finalized, interim);
  }

  function stopSession() {
    if (maxTimer) clearTimeout(maxTimer);
    capture?.stop();
    capture = null;
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
    capture = await startPcmCapture({
      getUserMedia,
      AudioContextImpl,
      onChunk: (samples, sampleRate) => {
        if (!socket || socket.readyState !== WebSocketImpl.OPEN) return;
        socket.send(floatToLinear16(downsampleTo16k(samples, sampleRate)));
      },
    });
    if (!capture) {
      stopSession();
      return null;
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
    getPcm: () =>
      capture
        ? { samples: capture.getSamples(), sampleRate: capture.sampleRate }
        : { samples: new Float32Array(0), sampleRate: 16000 },
  };
}
