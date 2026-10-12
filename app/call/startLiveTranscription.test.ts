import { describe, expect, it, vi } from "vitest";
import { startLiveTranscriptionSession, KEEPALIVE_MS } from "./startLiveTranscription";

function tokenFetch(ok: boolean, accessToken = "dg-jwt") {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => (ok ? { accessToken } : { error: "unavailable" }),
  }) as unknown as typeof fetch;
}

const emptyMic = async () =>
  ({ getTracks: () => [] }) as unknown as MediaStream;

type FakeProcessor = {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onaudioprocess: ((event: {
    inputBuffer: { getChannelData: (channel: number) => Float32Array };
  }) => void) | null;
};

type FakeGain = {
  gain: { value: number };
  connect: ReturnType<typeof vi.fn>;
};

function FakeAudioContext(
  resume?: () => Promise<void>,
  created: Array<{ processor: FakeProcessor; gain: FakeGain; destination: object }> = [],
) {
  return class {
    sampleRate = 16000;
    destination = {};
    resume = resume;
    processor: FakeProcessor = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    };
    gain: FakeGain = { gain: { value: 1 }, connect: vi.fn() };
    constructor() {
      created.push({
        processor: this.processor,
        gain: this.gain,
        destination: this.destination,
      });
    }
    createMediaStreamSource() {
      return { connect: vi.fn() };
    }
    createScriptProcessor() {
      return this.processor;
    }
    createGain() {
      return this.gain;
    }
    close() {}
  } as unknown as new () => never;
}

function FakeListenSocket({
  outcome,
  onConstruct,
  close = () => {},
}: {
  outcome: "open" | "error";
  onConstruct?: (url: string, protocols?: string | string[]) => void;
  close?: () => void;
}) {
  return class {
    static OPEN = 1;
    readyState = 0;
    binaryType = "";
    listeners: { open: Array<() => void>; error: Array<() => void> } = {
      open: [],
      error: [],
    };
    constructor(url: string, protocols?: string | string[]) {
      onConstruct?.(url, protocols);
      queueMicrotask(() => {
        if (outcome === "open") {
          this.readyState = 1;
          this.listeners.open.forEach((listener) => listener());
          return;
        }
        this.listeners.error.forEach((listener) => listener());
      });
    }
    addEventListener(type: string, listener: () => void) {
      if (type === "open" || type === "error") this.listeners[type].push(listener);
    }
    send() {}
    close = close;
  } as unknown as typeof WebSocket;
}

function ControllableListenSocket({
  onSend,
  onClose,
  onConstruct,
}: {
  onSend?: (data: ArrayBuffer | string) => void;
  onClose?: () => void;
  onConstruct?: (socket: { open: () => void; emit: (type: "error" | "close") => void }) => void;
}) {
  return class {
    static OPEN = 1;
    readyState = 0;
    binaryType = "";
    listeners: Record<string, Array<() => void>> = {};
    constructor() {
      onConstruct?.(this);
    }
    addEventListener(type: string, listener: () => void) {
      (this.listeners[type] ??= []).push(listener);
    }
    send(data: ArrayBuffer | string) {
      onSend?.(data);
    }
    close() {
      onClose?.();
    }
    open() {
      this.readyState = 1;
      (this.listeners.open ?? []).forEach((listener) => listener());
    }
    emit(type: "error" | "close") {
      (this.listeners[type] ?? []).forEach((listener) => listener());
    }
  } as unknown as typeof WebSocket;
}

describe("startLiveTranscriptionSession", () => {
  it("stops pending capture and ignores pause changes after Stop", async () => {
    const stopTrack = vi.fn();
    let resolveMic!: (stream: MediaStream) => void;
    const pendingMic = new Promise<MediaStream>((resolve) => { resolveMic = resolve; });
    const getUserMedia = vi.fn().mockImplementationOnce(emptyMic).mockReturnValue(pendingMic);
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });
    expect(session).not.toBeNull();
    try {
      session!.setPaused(true);
      session!.setPaused(false);
      session!.stop();
      session!.setPaused(true);
      session!.setPaused(false);
      resolveMic({ getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(getUserMedia).toHaveBeenCalledTimes(2);
      expect(stopTrack).toHaveBeenCalledOnce();
    } finally {
      session?.stop();
    }
  });

  it("keeps the newest resume when older microphone requests finish later", async () => {
    const staleStop = vi.fn();
    const newestStop = vi.fn();
    let resolveStale!: (stream: MediaStream) => void;
    let resolveNewest!: (stream: MediaStream) => void;
    const staleMic = new Promise<MediaStream>((resolve) => { resolveStale = resolve; });
    const newestMic = new Promise<MediaStream>((resolve) => { resolveNewest = resolve; });
    const created: Array<{ processor: FakeProcessor; gain: FakeGain; destination: object }> = [];
    const send = vi.fn();
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: vi.fn().mockImplementationOnce(emptyMic)
        .mockReturnValueOnce(staleMic).mockReturnValueOnce(newestMic),
      WebSocketImpl: ControllableListenSocket({
        onConstruct: (socket) => { queueMicrotask(() => socket.open()); },
        onSend: send,
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });
    expect(session).not.toBeNull();
    try {
      session!.setPaused(true);
      session!.setPaused(false);
      session!.setPaused(true);
      session!.setPaused(false);
      resolveNewest({ getTracks: () => [{ stop: newestStop }] } as unknown as MediaStream);
      await new Promise((resolve) => setTimeout(resolve, 0));
      resolveStale({ getTracks: () => [{ stop: staleStop }] } as unknown as MediaStream);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(staleStop).toHaveBeenCalledOnce();
      const audioEvent = { inputBuffer: { getChannelData: () => new Float32Array([0.25]) } };
      created[2].processor.onaudioprocess?.(audioEvent);
      expect(send).not.toHaveBeenCalled();
      const queuedNewestAudio = created[1].processor.onaudioprocess!;
      queuedNewestAudio(audioEvent);
      expect(send).toHaveBeenCalledOnce();
      session!.setPaused(true);
      expect(newestStop).toHaveBeenCalledOnce();
      queuedNewestAudio(audioEvent);
      expect(send).toHaveBeenCalledOnce();
    } finally {
      session?.stop();
    }
  });

  it("stops a resumed microphone that finishes opening after Pause", async () => {
    const stopTrack = vi.fn();
    let resolveMic!: (stream: MediaStream) => void;
    const pendingMic = new Promise<MediaStream>((resolve) => { resolveMic = resolve; });
    const getUserMedia = vi.fn().mockImplementationOnce(emptyMic).mockReturnValueOnce(pendingMic);
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });
    expect(session).not.toBeNull();
    try {
      session!.setPaused(true);
      session!.setPaused(false);
      session!.setPaused(true);
      resolveMic({ getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(stopTrack).toHaveBeenCalledOnce();
    } finally {
      session?.stop();
    }
  });

  it("does not report a committed stream closing as unavailable", async () => {
    const onUnavailable = vi.fn();
    let socket: { open: () => void; emit: (type: "error" | "close") => void } | null = null;
    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      onUnavailable,
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onConstruct: (instance) => { socket = instance; },
      }),
      AudioContextImpl: FakeAudioContext(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();

    session?.commit();
    socket?.emit("close");
    expect(onUnavailable).not.toHaveBeenCalled();
    session?.stop();
  });

  it("reports a socket loss once after the session opens", async () => {
    const onUnavailable = vi.fn();
    let socket: { open: () => void; emit: (type: "error" | "close") => void } | null = null;
    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      onUnavailable,
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onConstruct: (instance) => { socket = instance; },
      }),
      AudioContextImpl: FakeAudioContext(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();

    socket?.emit("close");
    socket?.emit("error");
    expect(onUnavailable).toHaveBeenCalledOnce();
    session?.stop();
  });

  it("returns null when the Deepgram token route is unavailable", async () => {
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(false),
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).toBeNull();
  });

  it("returns null when the Deepgram token request rejects", async () => {
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: vi
        .fn()
        .mockRejectedValue(new TypeError("network")) as unknown as typeof fetch,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).toBeNull();
  });

  it("returns null when the Deepgram token request stays pending", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokenTimeoutMs: 10,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).toBeNull();
  });

  it("returns null when the Deepgram token response body stays pending", async () => {
    const fetchImpl = vi.fn((_url: string, init: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      }),
    );

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokenTimeoutMs: 10,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).toBeNull();
  });

  it("returns null when the listen socket errors before it opens", async () => {
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: FakeListenSocket({ outcome: "error" }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).toBeNull();
  });

  it("connects listen with a Bearer JWT and no token query", async () => {
    const constructed: Array<{ url: string; protocols?: string | string[] }> =
      [];

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: FakeListenSocket({
        outcome: "open",
        onConstruct: (url, protocols) => constructed.push({ url, protocols }),
      }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).not.toBeNull();
    expect(constructed).toHaveLength(1);
    const url = new URL(constructed[0]!.url);
    expect(url.pathname).toBe("/v1/listen");
    expect(url.searchParams.get("model")).toBe("nova-3");
    expect(url.searchParams.get("language")).toBe("ja");
    expect(url.searchParams.get("token")).toBeNull();
    expect(constructed[0]!.protocols).toEqual(["bearer", "dg-jwt"]);
  });

  it("resumes the audio context before returning a listen session", async () => {
    const resume = vi.fn().mockResolvedValue(undefined);

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(resume),
    });

    expect(session).not.toBeNull();
    expect(resume).toHaveBeenCalled();
  });

  it("closes a listen socket that errors before it opens", async () => {
    const close = vi.fn();

    await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: FakeListenSocket({ outcome: "error", close }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(close).toHaveBeenCalled();
  });

  it("mutes the ScriptProcessor tap", async () => {
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    expect(session).not.toBeNull();
    expect(created[0]?.gain.gain.value).toBe(0);
    expect(created[0]?.processor.connect).toHaveBeenCalledWith(created[0]?.gain);
    expect(created[0]?.gain.connect).toHaveBeenCalledWith(created[0]?.destination);

    session!.stop();
  });

  it("sends audio captured before the listen socket opens, in order", async () => {
    const sent: Array<ArrayBuffer | string> = [];
    let socket: { open: () => void } | null = null;
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    // Token fetched and capture started while the socket is still CONNECTING.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(created[0]).toBeDefined();

    const tone = new Float32Array([0.5, -0.5]);
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => tone },
    });
    expect(sent).toHaveLength(0);

    socket?.open();
    const session = await sessionPromise;

    expect(session).not.toBeNull();
    expect(sent).toHaveLength(1);
    const view = new DataView(sent[0] as ArrayBuffer);
    expect(view.getInt16(0, true)).toBe(16383);
    expect(view.getInt16(2, true)).toBe(-16384);
  });

  it("keeps the socket open on pause and sends KeepAlive", async () => {
    vi.useFakeTimers();
    const sent: Array<ArrayBuffer | string> = [];
    let closes = 0;
    let socket: { open: () => void } | null = null;

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onClose: () => {
          closes += 1;
        },
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(),
    });

    await vi.advanceTimersByTimeAsync(0);
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();

    session!.setPaused(true);
    expect(closes).toBe(0);
    expect(sent).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(KEEPALIVE_MS);
    expect(sent).toContain(JSON.stringify({ type: "KeepAlive" }));
    expect(closes).toBe(0);

    session!.stop();
    vi.useRealTimers();
  });

  it("resumes audio on the same socket after unpause", async () => {
    vi.useFakeTimers();
    const sent: Array<ArrayBuffer | string> = [];
    let closes = 0;
    let constructed = 0;
    let socket: { open: () => void } | null = null;
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onClose: () => {
          closes += 1;
        },
        onConstruct: (instance) => {
          socket = instance;
          constructed += 1;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    await vi.advanceTimersByTimeAsync(0);
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();

    session!.setPaused(true);
    session!.setPaused(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(created).toHaveLength(2);
    const tone = new Float32Array([0.25]);
    created[1]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => tone },
    });

    expect(constructed).toBe(1);
    expect(closes).toBe(0);
    const binary = sent.filter(
      (item): item is ArrayBuffer => typeof item !== "string",
    );
    expect(binary).toHaveLength(1);
    expect(new DataView(binary[0]!).getInt16(0, true)).toBe(8191);

    session!.stop();
    vi.useRealTimers();
  });

  it("does not open the microphone while paused at startup", async () => {
    const state = { paused: true, pauseVersion: 0 };
    const getUserMedia = vi.fn().mockImplementation(emptyMic);

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      getControlState: () => state,
      fetchImpl: tokenFetch(true),
      getUserMedia,
      WebSocketImpl: FakeListenSocket({ outcome: "open" }),
      AudioContextImpl: FakeAudioContext(),
    });

    expect(session).not.toBeNull();
    expect(getUserMedia).not.toHaveBeenCalled();

    state.paused = false;
    session!.setPaused(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getUserMedia).toHaveBeenCalledOnce();

    session!.stop();
  });

  it("does not transmit audio while paused during startup, and resumes on the same socket", async () => {
    const state = { paused: false, pauseVersion: 0 };
    const sent: Array<ArrayBuffer | string> = [];
    let socket: { open: () => void } | null = null;
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      getControlState: () => state,
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();
    expect(created[0]).toBeDefined();

    state.paused = true;
    const tone = new Float32Array([0.5]);
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => tone },
    });
    expect(sent).toHaveLength(0);

    state.paused = false;
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => tone },
    });
    expect(sent).toHaveLength(1);

    session!.stop();
  });

  it("drops audio buffered before a pause during startup", async () => {
    const state = { paused: false, pauseVersion: 0 };
    const sent: Array<ArrayBuffer | string> = [];
    let socket: { open: () => void } | null = null;
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      getControlState: () => state,
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([0.5]) },
    });
    expect(sent).toHaveLength(0);

    state.paused = true;
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();
    expect(sent).toHaveLength(0);

    session!.stop();
  });

  it("stops the microphone and returns null when startup is aborted", async () => {
    const stopTrack = vi.fn();
    const onUnavailable = vi.fn();
    const controller = new AbortController();
    let socket: { open: () => void } | null = null;

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      onUnavailable,
      signal: controller.signal,
      fetchImpl: tokenFetch(true),
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
      WebSocketImpl: ControllableListenSocket({
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    socket?.open();
    const session = await sessionPromise;

    expect(session).toBeNull();
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it("does not open the socket or microphone when startup is aborted during the token request", async () => {
    const controller = new AbortController();
    const getUserMedia = vi.fn().mockImplementation(emptyMic);
    const onConstruct = vi.fn();
    const fetchImpl = vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      }),
    );

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      signal: controller.signal,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getUserMedia,
      WebSocketImpl: FakeListenSocket({ outcome: "open", onConstruct }),
      AudioContextImpl: FakeAudioContext(),
    });

    controller.abort();
    const session = await sessionPromise;

    expect(session).toBeNull();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(onConstruct).not.toHaveBeenCalled();
  });

  it("releases a pending microphone when startup is aborted", async () => {
    const stopTrack = vi.fn();
    const onUnavailable = vi.fn();
    const onClose = vi.fn();
    let resolveMic!: (stream: MediaStream) => void;
    const pendingMic = new Promise<MediaStream>((resolve) => {
      resolveMic = resolve;
    });
    const controller = new AbortController();
    let socket: { emit: (type: "error" | "close") => void } | null = null;

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      onUnavailable,
      signal: controller.signal,
      fetchImpl: tokenFetch(true),
      getUserMedia: vi.fn().mockReturnValue(pendingMic),
      WebSocketImpl: ControllableListenSocket({
        onClose,
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    expect(onClose).toHaveBeenCalled();

    resolveMic({ getTracks: () => [{ stop: stopTrack }] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(onUnavailable).not.toHaveBeenCalled();

    socket?.emit("error");
    await expect(sessionPromise).resolves.toBeNull();
  });

  it("drops audio buffered before a pause that is resumed during startup", async () => {
    const state = { paused: false, pauseVersion: 0 };
    const sent: Array<ArrayBuffer | string> = [];
    let socket: { open: () => void } | null = null;
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      getControlState: () => state,
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([0.5]) },
    });
    expect(sent).toHaveLength(0);

    // The student pauses and resumes before the socket opens; the hook bumps
    // the version on every pause.
    state.paused = true;
    state.pauseVersion += 1;
    state.paused = false;

    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();
    expect(sent).toHaveLength(0);

    session!.stop();
  });

  it("releases the microphone when startup is aborted before capture initializes", async () => {
    const stopTrack = vi.fn();
    const onUnavailable = vi.fn();
    let resolveResume!: () => void;
    const pendingResume = new Promise<void>((resolve) => {
      resolveResume = resolve;
    });
    const controller = new AbortController();
    let socket: { emit: (type: "error" | "close") => void } | null = null;

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      onUnavailable,
      signal: controller.signal,
      fetchImpl: tokenFetch(true),
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: stopTrack }],
      }),
      WebSocketImpl: ControllableListenSocket({
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(() => pendingResume),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    expect(stopTrack).toHaveBeenCalledOnce();

    resolveResume();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stopTrack).toHaveBeenCalledOnce();

    socket?.emit("error");
    await expect(sessionPromise).resolves.toBeNull();
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it("keeps speech buffered after resume and drops the pre-pause buffer", async () => {
    const state = { paused: false, pauseVersion: 0 };
    const sent: Array<ArrayBuffer | string> = [];
    let socket: { open: () => void } | null = null;
    const created: Array<{
      processor: FakeProcessor;
      gain: FakeGain;
      destination: object;
    }> = [];

    const sessionPromise = startLiveTranscriptionSession({
      onEvent: vi.fn(),
      getControlState: () => state,
      fetchImpl: tokenFetch(true),
      getUserMedia: emptyMic,
      WebSocketImpl: ControllableListenSocket({
        onSend: (data) => sent.push(data),
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([0.5]) },
    });
    expect(sent).toHaveLength(0);

    state.paused = true;
    state.pauseVersion += 1;
    state.paused = false;

    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([-0.5]) },
    });

    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();
    const binary = sent.filter(
      (item): item is ArrayBuffer => typeof item !== "string",
    );
    expect(binary).toHaveLength(1);
    expect(new DataView(binary[0]!).getInt16(0, true)).toBe(-16384);

    session!.stop();
  });

});
