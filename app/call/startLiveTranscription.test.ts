import { describe, expect, it, vi } from "vitest";
import { startLiveTranscriptionSession } from "./startLiveTranscription";

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
});
