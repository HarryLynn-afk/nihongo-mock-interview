import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  SPEAK_IDLE_PAUSE_MS,
  useAnswerCapture,
} from "./useAnswerCapture";
import * as liveTranscription from "./startLiveTranscription";
import * as pcmCapture from "./pcmCapture";

describe("useAnswerCapture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "answered",
        transcript: "こんにちは",
        audioClip: expect.any(Blob),
        pushbackCount: 0,
      }),
    );
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

  it("saves a WAV delivery clip from one local PCM capture when live transcription is unavailable", async () => {
    const samples = new Float32Array(1600);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = 0.3 * Math.sin(index / 10);
    }
    const startCapture = vi
      .spyOn(pcmCapture, "startPcmCapture")
      .mockResolvedValue({
        sampleRate: 16_000,
        getSamples: () => samples,
        stop: vi.fn(),
      });
    const stopLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue(null);

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
      await Promise.resolve();
    });

    act(() => {
      created[0]?.onresult?.({
        results: [Object.assign([{ transcript: "こんにちは" }], { isFinal: true })],
      });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledOnce();
    const clip = onSubmit.mock.calls[0][0].audioClip as Blob;
    expect(clip.type).toBe("audio/wav");
    expect(clip.size).toBeGreaterThan(44);

    startCapture.mockRestore();
    stopLive.mockRestore();
  });

  it("does not keep the previous turn's audio clip after the student turn resets", async () => {
    const firstTurn = new Float32Array(100).fill(0.2);
    const secondTurn = new Float32Array(200).fill(0.2);
    const startCapture = vi
      .spyOn(pcmCapture, "startPcmCapture")
      .mockResolvedValueOnce({
        sampleRate: 16_000,
        getSamples: () => firstTurn,
        stop: vi.fn(),
      })
      .mockResolvedValueOnce({
        sampleRate: 16_000,
        getSamples: () => secondTurn,
        stop: vi.fn(),
      });

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
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      created[0]?.onresult?.({
        results: [Object.assign([{ transcript: "はい" }], { isFinal: true })],
      });
    });
    act(() => result.current.onSubmitClick());
    const firstSize = (onSubmit.mock.calls[0][0].audioClip as Blob).size;

    rerender({ active: false });
    created.length = 0;
    rerender({ active: true });

    act(() => result.current.onSpeakAnswer());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      created[0]?.onresult?.({
        results: [Object.assign([{ transcript: "ええ" }], { isFinal: true })],
      });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit.mock.calls[1][0].transcript).toBe("ええ");
    const secondSize = (onSubmit.mock.calls[1][0].audioClip as Blob).size;
    expect(secondSize).not.toBe(firstSize);
    expect(secondSize).toBeGreaterThan(firstSize);

    startCapture.mockRestore();
  });

  it("submits a WAV clip from live PCM and does not open a second microphone", async () => {
    vi.useFakeTimers();
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    class FakeMediaRecorder {
      start = vi.fn();
      stop = vi.fn();
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

    const samples = new Float32Array(16000);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = 0.3 * Math.sin(index / 10);
    }
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue({
        stop: vi.fn(),
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
        getPcm: () => ({ samples, sampleRate: 16000 }),
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
    expect(onSubmit.mock.calls[0][0].audioClip.type).toBe("audio/wav");
    expect(onSubmit.mock.calls[0][0].audioClip.size).toBeGreaterThan(44);

    startLive.mockRestore();
    vi.useRealTimers();
  });

  it("stores one answer when Submit is clicked twice during the live wait", async () => {
    vi.useFakeTimers();
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue({
        stop: vi.fn(),
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
        getPcm: () => ({ samples: new Float32Array(), sampleRate: 16000 }),
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
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
        getPcm: () => ({ samples: new Float32Array(), sampleRate: 16000 }),
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
});
