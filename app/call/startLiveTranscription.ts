import { downsampleTo16k, floatToLinear16 } from "./pcmAudio";
import { startPcmCapture, type PcmAudioContext, type PcmCapture } from "./pcmCapture";
import {
  closeStreamMessage,
  deepgramListenUrl,
  joinJapanese,
  keepAliveMessage,
  parseDeepgramMessage,
  type ParsedTranscriptionEvent,
} from "./transcriptionEvents";

export type LiveTranscriptionSession = {
  stop: () => void;
  setPaused: (paused: boolean) => void;
  commit: () => void;
  getTranscript: () => string;
};

const MAX_LISTEN_MS = 20 * 60 * 1000;
const OPEN_WAIT_MS = 3000;
/** Deepgram closes a silent stream after ~10s; KeepAlive resets that. */
export const KEEPALIVE_MS = 8_000;

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
  onUnavailable,
  fetchImpl = fetch,
  getUserMedia = () => navigator.mediaDevices.getUserMedia({ audio: true }),
  WebSocketImpl = globalThis.WebSocket,
  AudioContextImpl = (
    globalThis as typeof globalThis & { AudioContext?: new () => PcmAudioContext }
  ).AudioContext,
}: {
  onEvent: (event: ParsedTranscriptionEvent) => void;
  onUnavailable?: () => void;
  fetchImpl?: typeof fetch;
  getUserMedia?: () => Promise<MediaStream>;
  WebSocketImpl?: typeof WebSocket;
  AudioContextImpl?: new () => PcmAudioContext;
}): Promise<LiveTranscriptionSession | null> {
  if (typeof WebSocketImpl !== "function" || typeof AudioContextImpl !== "function") {
    return null;
  }

  let tokenRes: Response;
  try {
    tokenRes = await fetchImpl("/api/deepgram-stt", { method: "POST" });
  } catch {
    return null;
  }
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
  const pendingAudio: ArrayBuffer[] = [];
  let paused = false;
  let stopped = false;
  let captureVersion = 0;
  let ready = false;
  let lost = false;
  let committing = false;
  let keepAliveTimer: ReturnType<typeof setInterval> | undefined;

  function getTranscript(): string {
    return joinJapanese(finalized, interim);
  }

  function stopSession() {
    if (maxTimer) clearTimeout(maxTimer);
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = undefined;
    stopped = true;
    capture?.stop();
    capture = null;
    if (socket) {
      socket.close();
    }
    socket = null;
  }

  function startCapture(version = captureVersion): Promise<PcmCapture | null> {
    return startPcmCapture({
      getUserMedia,
      AudioContextImpl,
      onChunk: (samples, sampleRate) => {
        if (stopped || paused || version !== captureVersion) return;
        const pcm = floatToLinear16(downsampleTo16k(samples, sampleRate));
        if (!socket || socket.readyState !== WebSocketImpl.OPEN) {
          pendingAudio.push(pcm);
          return;
        }
        socket.send(pcm);
      },
    });
  }

  function setPaused(next: boolean) {
    if (stopped || next === paused) return;
    paused = next;
    const version = ++captureVersion;
    if (paused) {
      capture?.stop();
      capture = null;
      keepAliveTimer = setInterval(() => {
        if (socket && socket.readyState === WebSocketImpl.OPEN) {
          socket.send(keepAliveMessage());
        }
      }, KEEPALIVE_MS);
      return;
    }
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = undefined;
    }
    void startCapture(version).then((resumed) => {
      if (stopped || paused || version !== captureVersion) {
        resumed?.stop();
        return;
      }
      capture = resumed;
    });
  }

  try {
    // Two protocols: a space in one string is an invalid Sec-WebSocket-Protocol.
    socket = new WebSocketImpl(deepgramListenUrl(), ["bearer", accessToken]);
    socket.binaryType = "arraybuffer";
    // Start the mic now: speech during the handshake must not be lost.
    const capturePromise = startCapture();
    const opened = await waitForListenOpen(socket, WebSocketImpl);
    if (!opened) {
      void capturePromise.then((pending) => pending?.stop());
      stopSession();
      return null;
    }

    const onLoss = () => {
      if (stopped || committing) return;
      lost = true;
      if (!ready) return;
      stopSession();
      onUnavailable?.();
    };
    socket.addEventListener("error", onLoss);
    socket.addEventListener("close", onLoss);

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

    capture = await capturePromise;
    if (!capture || lost) {
      stopSession();
      return null;
    }
    // Flush speech captured during the handshake, in order.
    for (const pcm of pendingAudio) {
      socket.send(pcm);
    }
    pendingAudio.length = 0;

    if (lost) {
      stopSession();
      return null;
    }

    maxTimer = setTimeout(() => {
      stopSession();
    }, MAX_LISTEN_MS);
    ready = true;
  } catch {
    stopSession();
    return null;
  }

  return {
    stop: stopSession,
    setPaused,
    commit: () => {
      if (socket && socket.readyState === WebSocketImpl.OPEN) {
        committing = true;
        socket.send(closeStreamMessage());
      }
    },
    getTranscript,
  };
}
