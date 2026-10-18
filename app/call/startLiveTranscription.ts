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

async function fetchListenToken(
  fetchImpl: typeof fetch,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const res = await fetchImpl("/api/deepgram-stt", {
      method: "POST",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null) return null;
    const accessToken = (body as { accessToken?: unknown }).accessToken;
    return typeof accessToken === "string" ? accessToken : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
  getControlState = () => ({ paused: false, pauseVersion: 0 }),
  signal,
  tokenTimeoutMs = 5000,
}: {
  onEvent: (event: ParsedTranscriptionEvent) => void;
  onUnavailable?: () => void;
  fetchImpl?: typeof fetch;
  getUserMedia?: () => Promise<MediaStream>;
  WebSocketImpl?: typeof WebSocket;
  AudioContextImpl?: new () => PcmAudioContext;
  /**
   * `pauseVersion` counts the caller's pauses: startup drops unsent audio
   * buffered before the current version.
   */
  getControlState?: () => { paused: boolean; pauseVersion: number };
  signal?: AbortSignal;
  tokenTimeoutMs?: number;
}): Promise<LiveTranscriptionSession | null> {
  if (typeof WebSocketImpl !== "function" || typeof AudioContextImpl !== "function") {
    return null;
  }

  const accessToken = await fetchListenToken(fetchImpl, tokenTimeoutMs, signal);
  if (accessToken === null) return null;
  if (signal?.aborted) return null;

  let finalized = "";
  let interim = "";
  let capture: PcmCapture | null = null;
  /** Cancels whichever capture attempt is still initializing. */
  let activeAttempt: AbortController | null = null;
  let socket: WebSocket | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;
  const pendingAudio: ArrayBuffer[] = [];
  let bufferPauseVersion = 0;
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
    activeAttempt?.abort();
    activeAttempt = null;
    capture?.stop();
    capture = null;
    if (socket) {
      socket.close();
    }
    socket = null;
  }

  function startCapture(version = captureVersion): Promise<PcmCapture | null> {
    const attempt = new AbortController();
    activeAttempt = attempt;
    return startPcmCapture({
      getUserMedia,
      AudioContextImpl,
      signal: attempt.signal,
      onChunk: (samples, sampleRate) => {
        if (stopped || paused || version !== captureVersion) return;
        const control = getControlState();
        if (control.paused || control.pauseVersion !== bufferPauseVersion) {
          // Unsent audio buffered before a pause is stale; never flush it later.
          pendingAudio.length = 0;
          bufferPauseVersion = control.pauseVersion;
          if (control.paused) return;
        }
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
      activeAttempt?.abort();
      activeAttempt = null;
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
      if (!resumed) {
        // The resumed microphone was denied; recover like any lost capture.
        stopSession();
        onUnavailable?.();
        return;
      }
      capture = resumed;
    });
  }

  signal?.addEventListener("abort", () => stopSession(), { once: true });

  try {
    // Two protocols: a space in one string is an invalid Sec-WebSocket-Protocol.
    socket = new WebSocketImpl(deepgramListenUrl(), ["bearer", accessToken]);
    socket.binaryType = "arraybuffer";
    // Start the mic now: speech during the handshake must not be lost.
    // Paused before startup: connect the socket, but wait for resume to capture.
    const control = getControlState();
    if (control.paused) setPaused(true);
    bufferPauseVersion = control.pauseVersion;
    const wantsCapture = !paused;
    const capturePromise = wantsCapture ? startCapture() : Promise.resolve(null);
    const opened = await waitForListenOpen(socket, WebSocketImpl);
    if (!opened) {
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
    if ((wantsCapture && !capture) || lost || signal?.aborted) {
      stopSession();
      return null;
    }
    // Flush speech captured during the handshake, in order. Chunks buffered
    // before a pause are stale and are dropped instead.
    const current = getControlState();
    if (!current.paused && current.pauseVersion === bufferPauseVersion) {
      for (const pcm of pendingAudio) {
        socket.send(pcm);
      }
    }
    pendingAudio.length = 0;

    if (lost) {
      stopSession();
      return null;
    }

    maxTimer = setTimeout(() => {
      stopSession();
      if (!committing) onUnavailable?.();
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
