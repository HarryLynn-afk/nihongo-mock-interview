import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  SPEAK_IDLE_PAUSE_MS,
  useAnswerCapture,
} from "./useAnswerCapture";
import * as liveTranscription from "./startLiveTranscription";

function installLiveBrowser() {
  const sockets: FakeSocket[] = [];
  class FakeSocket {
    static OPEN = 1;
    readyState = 0;
    binaryType = "";
    listeners: Record<string, Array<(event: { data: string }) => void>> = {};
    constructor() {
      sockets.push(this);
      queueMicrotask(() => {
        this.readyState = 1;
        this.emit("open");
      });
    }
    addEventListener(type: string, listener: (event: { data: string }) => void) {
      (this.listeners[type] ??= []).push(listener);
    }
    emit(type: string, data = "") {
      this.listeners[type]?.forEach((listener) => listener({ data }));
    }
    speech(transcript: string, final = true) {
      this.emit("message", JSON.stringify({
        type: "Results", is_final: final,
        channel: { alternatives: [{ transcript }] },
      }));
    }
    send() {}
    close() { this.readyState = 3; this.emit("close"); }
  }
  class FakeAudioContext {
    sampleRate = 16000;
    destination = {};
    createMediaStreamSource() { return { connect() {} }; }
    createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null }; }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    close() {}
  }
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ accessToken: "dg-jwt" }) }));
  return sockets;
}

function installBrowserRecognition() {
  const created: FakeSpeechRecognition[] = [];
  class FakeSpeechRecognition {
    lang = "";
    interimResults = false;
    continuous = false;
    onresult: ((event: { resultIndex: number; results: unknown[] }) => void) | null = null;
    onend: (() => void) | null = null;
    onerror = null;
    start = vi.fn();
    stop = vi.fn();
    constructor() { created.push(this); }
  }
  vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
  return created;
}

function speechResult(transcript: string, isFinal = true) {
  return Object.assign([{ transcript }], { isFinal });
}

describe("useAnswerCapture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("submits every final segment from one browser recognition event", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useAnswerCapture({ active: true, micOn: true, onSubmit }));
    act(() => result.current.onSpeakAnswer());
    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("こんにちは。"), speechResult("私は学生です。")],
    }));
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。");
    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered", transcript: "こんにちは。私は学生です。", pushbackCount: 0,
    });
  });

  it("replaces changed interim speech while keeping unchanged earlier segments", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useAnswerCapture({ active: true, micOn: true, onSubmit }));
    act(() => result.current.onSpeakAnswer());
    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("こんにちは。"), speechResult("私は", false), speechResult("がく", false)],
    }));
    expect(result.current.liveCaption).toBe("こんにちは。私はがく");
    act(() => browser[0].onresult?.({
      resultIndex: 2,
      results: [speechResult("こんにちは。"), speechResult("私は", false), speechResult("学生です。", false)],
    }));
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。");
    act(() => browser[0].onresult?.({
      resultIndex: 2,
      results: [speechResult("こんにちは。"), speechResult("私は", false)],
    }));
    expect(result.current.liveCaption).toBe("こんにちは。私は");
    const finalResults = [speechResult("こんにちは。"), speechResult("私は学生です。")];
    act(() => browser[0].onresult?.({ resultIndex: 1, results: finalResults }));
    act(() => browser[0].onresult?.({ resultIndex: 2, results: finalResults }));
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。");
    act(() => browser[0].onend?.());
    expect(browser[0].start).toHaveBeenCalledTimes(2);
    act(() => browser[0].onresult?.({
      resultIndex: 0, results: [speechResult("よろしくお願いします。")],
    }));
    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered", transcript: "こんにちは。私は学生です。よろしくお願いします。", pushbackCount: 0,
    });
  });

  it("keeps unfinished browser speech through a pause and resume", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useAnswerCapture({ active: true, micOn: true, onSubmit }));

    act(() => result.current.onSpeakAnswer());
    act(() => {
      browser[0].onresult?.({
        resultIndex: 0,
        results: [speechResult("こんにちは。"), speechResult("私は", false)],
      });
    });
    expect(result.current.liveCaption).toBe("こんにちは。私は");

    act(() => result.current.onToggleSpeakPause());
    act(() => result.current.onToggleSpeakPause());

    act(() => {
      browser[1].onresult?.({
        resultIndex: 0,
        results: [speechResult("学生です。", false)],
      });
    });
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。");

    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered",
      transcript: "こんにちは。私は学生です。",
      pushbackCount: 0,
    });
  });

  it("keeps unfinished browser speech through a microphone off/on", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(
      ({ micOn }) => useAnswerCapture({ active: true, micOn, onSubmit }),
      { initialProps: { micOn: true } },
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      browser[0].onresult?.({
        resultIndex: 0,
        results: [speechResult("こんにちは。"), speechResult("私は", false)],
      });
    });

    rerender({ micOn: false });
    rerender({ micOn: true });

    act(() => {
      browser[1].onresult?.({
        resultIndex: 0,
        results: [speechResult("学生です。", false)],
      });
    });
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。");

    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered",
      transcript: "こんにちは。私は学生です。",
      pushbackCount: 0,
    });
  });

  it("keeps unfinished browser speech across Chrome's automatic silence restart", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useAnswerCapture({ active: true, micOn: true, onSubmit }));
    act(() => result.current.onSpeakAnswer());

    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("私は学生です。", false)],
    }));
    expect(result.current.liveCaption).toBe("私は学生です。");

    act(() => browser[0].onend?.());
    expect(browser[0].start).toHaveBeenCalledTimes(2);
    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("日本で勉強したいです。", false)],
    }));
    expect(result.current.liveCaption).toBe("私は学生です。日本で勉強したいです。");

    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered",
      transcript: "私は学生です。日本で勉強したいです。",
      pushbackCount: 0,
    });
  });

  it("keeps unfinished browser speech across a restart followed by pause and resume", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useAnswerCapture({ active: true, micOn: true, onSubmit }));
    act(() => result.current.onSpeakAnswer());

    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("私は学生です。", false)],
    }));
    act(() => browser[0].onend?.());
    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("日本で勉強したいです。", false)],
    }));

    act(() => result.current.onToggleSpeakPause());
    act(() => result.current.onToggleSpeakPause());

    act(() => browser[1].onresult?.({
      resultIndex: 0,
      results: [speechResult("日本で働きたいです。", false)],
    }));

    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered",
      transcript: "私は学生です。日本で勉強したいです。日本で働きたいです。",
      pushbackCount: 0,
    });
  });

  it("does not duplicate finalized browser speech across the automatic restart", () => {
    const browser = installBrowserRecognition();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useAnswerCapture({ active: true, micOn: true, onSubmit }));
    act(() => result.current.onSpeakAnswer());

    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("こんにちは。")],
    }));
    act(() => browser[0].onend?.());
    act(() => browser[0].onresult?.({
      resultIndex: 0,
      results: [speechResult("学生です。")],
    }));

    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered",
      transcript: "こんにちは。学生です。",
      pushbackCount: 0,
    });
  });

  it("submits both live sessions exactly once after microphone off/on", async () => {
    vi.useFakeTimers();
    const sockets = installLiveBrowser();
    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(({ micOn }) => useAnswerCapture({
      active: true, micOn, liveStt: true, onSubmit,
    }), { initialProps: { micOn: true } });
    act(() => result.current.onSpeakAnswer());
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[0].speech("こんにちは。"));
    rerender({ micOn: false });
    rerender({ micOn: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[1].speech("よろしくお願いします。", false));
    expect(result.current.liveCaption).toBe("こんにちは。よろしくお願いします。");
    act(() => result.current.onSubmitClick());
    act(() => sockets[1].speech("よろしくお願いします。"));
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered", transcript: "こんにちは。よろしくお願いします。", pushbackCount: 0,
    });
  });

  it("preserves interim speech across repeated microphone toggles", async () => {
    vi.useFakeTimers();
    const sockets = installLiveBrowser();
    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(({ micOn }) => useAnswerCapture({
      active: true, micOn, liveStt: true, onSubmit,
    }), { initialProps: { micOn: true } });
    act(() => result.current.onSpeakAnswer());
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => {
      sockets[0].speech("こんにちは。");
      sockets[0].speech("私は学生です。", false);
    });
    rerender({ micOn: false });
    rerender({ micOn: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[1].speech("日本語を勉強します。"));
    rerender({ micOn: false });
    rerender({ micOn: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[2].speech("よろしくお願いします。", false));
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。日本語を勉強します。よろしくお願いします。");
    act(() => result.current.onSubmitClick());
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered", transcript: "こんにちは。私は学生です。日本語を勉強します。よろしくお願いします。", pushbackCount: 0,
    });
  });

  it("starts the next turn without the previous live answer", async () => {
    vi.useFakeTimers();
    const sockets = installLiveBrowser();
    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(({ active }) => useAnswerCapture({
      active, micOn: true, liveStt: true, onSubmit,
    }), { initialProps: { active: true } });
    act(() => result.current.onSpeakAnswer());
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[0].speech("こんにちは。"));
    rerender({ active: false });
    rerender({ active: true });
    act(() => result.current.onSpeakAnswer());
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[1].speech("私は学生です。"));
    act(() => sockets[0].speech("古い回答です。"));
    expect(result.current.liveCaption).toBe("私は学生です。");
    act(() => result.current.onSubmitClick());
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered", transcript: "私は学生です。", pushbackCount: 0,
    });
  });

  it("preserves earlier sessions when the current live session falls back to the browser", async () => {
    vi.useFakeTimers();
    const sockets = installLiveBrowser();
    const browser: FakeSpeechRecognition[] = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      onend = null;
      onerror = null;
      start() {}
      stop() {}
      constructor() { browser.push(this); }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(({ micOn }) => useAnswerCapture({
      active: true, micOn, liveStt: true, onSubmit,
    }), { initialProps: { micOn: true } });
    act(() => result.current.onSpeakAnswer());
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => sockets[0].speech("こんにちは。"));
    rerender({ micOn: false });
    rerender({ micOn: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => {
      sockets[1].speech("私は学生です。", false);
      sockets[1].emit("error");
    });
    expect(result.current.liveCaption).toBe("こんにちは。私は学生です。");
    act(() => browser[0].onresult?.({
      results: [Object.assign([{ transcript: "よろしくお願いします。" }], { isFinal: true })],
    }));
    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      status: "answered", transcript: "こんにちは。私は学生です。よろしくお願いします。", pushbackCount: 0,
    });
  });

  it("starts browser recognition when the Deepgram token request rejects", async () => {
    const startBrowser = vi.fn();
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult = null;
      onend = null;
      onerror = null;
      start = startBrowser;
      stop = vi.fn();
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("WebSocket", class {});
    vi.stubGlobal("AudioContext", class {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { result } = renderHook(() => useAnswerCapture({
      active: true,
      micOn: true,
      liveStt: true,
      onSubmit: vi.fn(),
    }));
    act(() => result.current.onSpeakAnswer());

    await waitFor(() => expect(startBrowser).toHaveBeenCalledOnce());
  });

  it("keeps browser fallback and the live transcript after a socket loss and mic toggle", async () => {
    const sockets: FakeSocket[] = [];
    class FakeSocket {
      static OPEN = 1;
      readyState = 0;
      binaryType = "";
      listeners: Record<string, Array<(event?: { data: string }) => void>> = {};
      constructor() {
        sockets.push(this);
        queueMicrotask(() => {
          this.readyState = 1;
          this.emit("open");
        });
      }
      addEventListener(type: string, listener: (event?: { data: string }) => void) {
        (this.listeners[type] ??= []).push(listener);
      }
      emit(type: string, data = "") {
        this.listeners[type]?.forEach((listener) => listener({ data }));
      }
      send() {}
      close() {
        this.readyState = 3;
        this.emit("close");
      }
    }
    const browser: Array<{
      start: ReturnType<typeof vi.fn>;
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      onend = null;
      onerror = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        browser.push(this);
      }
    }
    class FakeAudioContext {
      sampleRate = 16000;
      destination = {};
      createMediaStreamSource() { return { connect() {} }; }
      createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null }; }
      createGain() { return { gain: { value: 1 }, connect() {} }; }
      close() {}
    }
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) } });
    const fetchToken = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ accessToken: "dg-jwt" }) });
    vi.stubGlobal("fetch", fetchToken);

    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(({ micOn }) => useAnswerCapture({
      active: true,
      micOn,
      liveStt: true,
      onSubmit,
    }), { initialProps: { micOn: true } });
    act(() => result.current.onSpeakAnswer());
    await waitFor(() => expect(sockets[0]?.readyState).toBe(1));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });

    act(() => {
      sockets[0]?.emit("message", JSON.stringify({
        type: "Results",
        is_final: true,
        channel: { alternatives: [{ transcript: "こんにちは。" }] },
      }));
      sockets[0]?.emit("close");
    });
    await waitFor(() => expect(browser).toHaveLength(1));
    expect(browser[0]?.start).toHaveBeenCalledOnce();
    expect(result.current.liveCaption).toBe("こんにちは。");

    rerender({ micOn: false });
    rerender({ micOn: true });
    expect(browser).toHaveLength(2);
    expect(browser[1]?.start).toHaveBeenCalledOnce();
    expect(fetchToken).toHaveBeenCalledOnce();

    act(() => browser[1]?.onresult?.({
      results: [Object.assign([{ transcript: "よろしくお願いします。" }], { isFinal: true })],
    }));
    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledWith({
      status: "answered",
      transcript: "こんにちは。よろしくお願いします。",
      pushbackCount: 0,
    });
  });

  it("auto-pauses Speak after idle silence with no new transcript", () => {
    vi.useFakeTimers();
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult = null;
      onend = null;
      onerror = null;
      start = vi.fn();
      stop = vi.fn();
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());
    expect(result.current.speakPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(SPEAK_IDLE_PAUSE_MS);
    });

    expect(result.current.speakPaused).toBe(true);
  });

  it("resets the idle pause timer when live transcript updates", () => {
    vi.useFakeTimers();
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      onend = null;
      onerror = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());

    act(() => {
      vi.advanceTimersByTime(SPEAK_IDLE_PAUSE_MS - 1_000);
    });
    act(() => {
      created[0]?.onresult?.({
        results: [
          Object.assign([{ transcript: "こんにちは" }], { isFinal: true }),
        ],
      });
    });
    act(() => {
      vi.advanceTimersByTime(SPEAK_IDLE_PAUSE_MS - 1_000);
    });

    expect(result.current.speakPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.speakPaused).toBe(true);
  });

  it("shows Speak answer while idle, before any choice is made", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.studentTurn).toBe("idle");
  });

  it("restarts browser speech when recognition ends while still listening", () => {
    const created: Array<{
      start: ReturnType<typeof vi.fn>;
      onend: (() => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error?: string }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());
    expect(created[0]?.start).toHaveBeenCalledTimes(1);

    act(() => {
      created[0]?.onend?.();
    });

    expect(created[0]?.start).toHaveBeenCalledTimes(2);
  });

  it("does not start browser speech until Speak answer is chosen", () => {
    const created: Array<{ start: ReturnType<typeof vi.fn> }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(created).toHaveLength(0);

    act(() => result.current.onSpeakAnswer());

    expect(created[0]?.start).toHaveBeenCalled();
  });

  it("studentTurn is speak after Speak answer", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());

    expect(result.current.studentTurn).toBe("speak");
  });

  it("Answer again from Speak returns to idle and drops the live caption", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      created[0]?.onresult?.({
        results: [
          Object.assign([{ transcript: "こんにちは" }], { isFinal: true }),
        ],
      });
    });
    expect(result.current.canAnswerAgain).toBe(true);

    act(() => result.current.onAnswerAgain());

    expect(result.current.studentTurn).toBe("idle");
    expect(result.current.liveCaption).toBeNull();
    expect(result.current.canAnswerAgain).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("a second Answer again on the same Question does not drop the new take", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => result.current.onAnswerAgain());

    act(() => result.current.onSpeakAnswer());
    act(() => {
      created[created.length - 1]?.onresult?.({
        results: [Object.assign([{ transcript: "はい" }], { isFinal: true })],
      });
    });
    expect(result.current.canAnswerAgain).toBe(false);

    act(() => result.current.onAnswerAgain());

    expect(result.current.studentTurn).toBe("speak");
    expect(result.current.liveCaption).toBe("はい");
  });

  it("Answer again after autoSpeak stays idle and does not auto-reenter Speak", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        autoSpeak: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.studentTurn).toBe("speak");

    act(() => result.current.onAnswerAgain());

    expect(result.current.studentTurn).toBe("idle");
  });

  it("restores Answer again when the next student turn becomes active", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAnswerCapture({
          active,
          micOn: true,
          onSubmit: vi.fn(),
        }),
      { initialProps: { active: true } },
    );

    act(() => result.current.onSpeakAnswer());
    act(() => result.current.onAnswerAgain());
    expect(result.current.canAnswerAgain).toBe(false);

    rerender({ active: false });
    rerender({ active: true });

    act(() => result.current.onSpeakAnswer());

    expect(result.current.canAnswerAgain).toBe(true);
  });

  it("updates the live Japanese caption from browser speech after Speak answer", () => {
    const created: FakeSpeechRecognition[] = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());

    expect(created[0]?.lang).toBe("ja-JP");

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: false,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });

    expect(result.current.liveCaption).toBe("こんにちは");
  });

  it("pauses speech recognition without clearing the live caption", () => {
    const created: FakeSpeechRecognition[] = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      created[0]?.onresult?.({
        results: [Object.assign([{ transcript: "こんにちは" }], { isFinal: true })],
      });
    });
    act(() => result.current.onToggleSpeakPause());

    expect(result.current.speakPaused).toBe(true);
    expect(result.current.liveCaption).toBe("こんにちは");
    expect(created[0]?.stop).toHaveBeenCalled();
  });

  it("resumes speech recognition after a pause", () => {
    const created: FakeSpeechRecognition[] = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => result.current.onToggleSpeakPause());
    act(() => result.current.onToggleSpeakPause());

    expect(result.current.speakPaused).toBe(false);
    expect(created[1]?.start).toHaveBeenCalled();
  });

  it("submits an answered AnswerSubmission from the live caption", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: true,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
        status: "answered",
        transcript: "こんにちは",
        pushbackCount: 0,
    });
  });

  it("empty Speak answer submit does not advance and shows Pushback (attempt 1 of 3)", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => result.current.onSubmitClick());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.pushbackVisible).toBe(true);
    expect(result.current.studentTurn).toBe("idle");
  });

  it("returns to idle for a retry after a failing Speak attempt", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], {
        isFinal: true,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.pushbackVisible).toBe(true);
    expect(result.current.studentTurn).toBe("idle");
  });

  it("hides Pushback once the student presses Speak answer again", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => result.current.onSubmitClick());
    expect(result.current.pushbackVisible).toBe(true);

    act(() => result.current.onSpeakAnswer());

    expect(result.current.studentTurn).toBe("speak");
  });

  it("skips the Question after 3 failing attempts instead of forcing a store", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    // Attempt 1: empty
    act(() => result.current.onSpeakAnswer());
    act(() => result.current.onSubmitClick());
    expect(onSubmit).not.toHaveBeenCalled();

    // Attempt 2: fails kana check
    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], { isFinal: true });
      created[created.length - 1]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());
    expect(onSubmit).not.toHaveBeenCalled();

    // Attempt 3: fails again — should skip instead of forcing a store
    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "still hello" }], {
        isFinal: true,
      });
      created[created.length - 1]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ status: "skipped" });
    expect(result.current.studentTurn).toBe("idle");
  });

  it("does not store a spoken transcript that fails the Pushback check", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], {
        isFinal: true,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.pushbackVisible).toBe(true);
  });

  it("stores a passing Speak answer after one Pushback with count 1", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], { isFinal: true });
      created[0]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "はい" }], { isFinal: true });
      created[1]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "answered",
        transcript: "はい",
        pushbackCount: 1,
      }),
    );
  });

  it("resets the Pushback attempt cap when the student turn ends", () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);

    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAnswerCapture({
          active,
          micOn: true,
          onSubmit,
        }),
      { initialProps: { active: true } },
    );

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], { isFinal: true });
      created[0]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    rerender({ active: false });
    rerender({ active: true });

    act(() => result.current.onSpeakAnswer());
    act(() => {
      const spoken = Object.assign([{ transcript: "はい" }], { isFinal: true });
      created[1]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "answered",
        transcript: "はい",
        pushbackCount: 0,
      }),
    );
  });

  it("resets Speak choice when a new student turn becomes active", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAnswerCapture({
          active,
          micOn: true,
          onSubmit: vi.fn(),
        }),
      { initialProps: { active: true } },
    );

    act(() => result.current.onSpeakAnswer());
    expect(result.current.studentTurn).toBe("speak");

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current.studentTurn).toBe("idle");
  });

  it("autoSpeak starts in Speak answer mode for pitch mode", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        autoSpeak: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.studentTurn).toBe("speak");
  });

  it("autoSpeak starts Speak again on the next student turn", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAnswerCapture({
          active,
          micOn: true,
          autoSpeak: true,
          onSubmit: vi.fn(),
        }),
      { initialProps: { active: true } },
    );

    expect(result.current.studentTurn).toBe("speak");

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current.studentTurn).toBe("speak");
  });

  it("submits the transcript after live idle auto-pause", async () => {
    vi.useFakeTimers();
    const stopLive = vi.fn();
    const setPausedLive = vi.fn();
    const commitLive = vi.fn();
    let onEvent:
      | ((event: { kind: "completed"; itemId: string; transcript: string }) => void)
      | undefined;
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockImplementation(async (args) => {
        onEvent = args.onEvent as typeof onEvent;
        return {
          stop: stopLive,
          setPaused: setPausedLive,
          commit: commitLive,
          getTranscript: () => "こんにちは。",
        };
      });

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        liveStt: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      onEvent?.({
        kind: "completed",
        itemId: "1",
        transcript: "こんにちは。",
      });
    });
    act(() => {
      vi.advanceTimersByTime(SPEAK_IDLE_PAUSE_MS);
    });
    expect(result.current.speakPaused).toBe(true);
    expect(setPausedLive).toHaveBeenCalledWith(true);
    expect(stopLive).not.toHaveBeenCalled();

    act(() => result.current.onSubmitClick());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(commitLive).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toEqual({ status: "answered", transcript: "こんにちは。", pushbackCount: 0 });

    startLive.mockRestore();
    vi.useRealTimers();
  });

  it("submits the live transcript without opening a second microphone", async () => {
    vi.useFakeTimers();
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    class FakeMediaRecorder {
      start = vi.fn();
      stop = vi.fn();
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue({
        stop: vi.fn(),
        setPaused: vi.fn(),
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
      });

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        liveStt: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    await act(async () => {
      await Promise.resolve();
    });

    act(() => result.current.onSubmitClick());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      status: "answered",
      transcript: "こんにちは。",
    });

    startLive.mockRestore();
    vi.useRealTimers();
  });

  it("stores one answer when Submit is clicked twice during the live wait", async () => {
    vi.useFakeTimers();
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue({
        stop: vi.fn(),
        setPaused: vi.fn(),
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
      });

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        liveStt: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.submitPending).toBe(false);
    act(() => result.current.onSubmitClick());
    expect(result.current.submitPending).toBe(true);
    act(() => result.current.onSubmitClick());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      status: "answered",
      transcript: "こんにちは。",
    });
    expect(result.current.submitPending).toBe(false);

    startLive.mockRestore();
    vi.useRealTimers();
  });

  it("leaves Speak after a live answer is stored so a second Submit does not store again", async () => {
    vi.useFakeTimers();
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue({
        stop: vi.fn(),
        setPaused: vi.fn(),
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
      });

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        liveStt: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.onSubmitClick());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(result.current.studentTurn).toBe("idle");
    act(() => result.current.onSubmitClick());
    expect(onSubmit).toHaveBeenCalledOnce();

    startLive.mockRestore();
    vi.useRealTimers();
  });

  it("passes the pause and cancellation state into the live startup", async () => {
    let args:
      | Parameters<typeof liveTranscription.startLiveTranscriptionSession>[0]
      | undefined;
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockImplementation((a) => {
        args = a;
        return new Promise<never>(() => {});
      });

    const { result, rerender } = renderHook(
      ({ micOn }: { micOn: boolean }) =>
        useAnswerCapture({
          active: true,
          micOn,
          liveStt: true,
          onSubmit: vi.fn(),
        }),
      { initialProps: { micOn: true } },
    );

    act(() => result.current.onSpeakAnswer());
    await act(async () => {
      await Promise.resolve();
    });

    expect(args?.getControlState?.()).toEqual({ paused: false, pauseVersion: 0 });
    expect(args?.signal?.aborted).toBe(false);

    act(() => result.current.onToggleSpeakPause());
    expect(args?.getControlState?.()).toEqual({ paused: true, pauseVersion: 1 });
    expect(args?.signal?.aborted).toBe(false);

    rerender({ micOn: false });
    expect(args?.signal?.aborted).toBe(true);

    startLive.mockRestore();
  });
});
