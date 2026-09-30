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
  onConstruct?: (socket: { open: () => void }) => void;
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
  } as unknown as typeof WebSocket;
}

describe("startLiveTranscriptionSession", () => {
  it("returns null when the Deepgram token route is unavailable", async () => {
    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: tokenFetch(false),
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

  it("mutes the ScriptProcessor tap and keeps a copy of the heard PCM", async () => {
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

    const tone = new Float32Array([0.2, -0.2, 0.4]);
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => tone },
    });

    const pcm = session!.getPcm();
    expect(Array.from(pcm.samples)).toEqual(Array.from(tone));
    expect(pcm.sampleRate).toBe(16000);
    expect(session!.getWords()).toEqual([]);
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

  it("keeps the delivery PCM captured before a pause", async () => {
    vi.useFakeTimers();
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
        onConstruct: (instance) => {
          socket = instance;
        },
      }),
      AudioContextImpl: FakeAudioContext(undefined, created),
    });

    await vi.advanceTimersByTimeAsync(0);
    socket?.open();
    const session = await sessionPromise;
    expect(session).not.toBeNull();

    const before = new Float32Array([0.5]);
    created[0]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => before },
    });

    session!.setPaused(true);
    session!.setPaused(false);
    await vi.advanceTimersByTimeAsync(0);

    const after = new Float32Array([1]);
    created[1]?.processor.onaudioprocess?.({
      inputBuffer: { getChannelData: () => after },
    });

    const pcm = session!.getPcm();
    expect(Array.from(pcm.samples)).toEqual([0.5, 1]);
    expect(pcm.sampleRate).toBe(16000);

    session!.stop();
    vi.useRealTimers();
  });
});
