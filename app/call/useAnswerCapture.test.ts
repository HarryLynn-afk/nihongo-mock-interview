import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAnswerCapture } from "./useAnswerCapture";

describe("useAnswerCapture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for Speak answer or Type answer before showing Submit or the answer box", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.speakAnswerVisible).toBe(true);
    expect(result.current.typeAnswerVisible).toBe(true);
    expect(result.current.submitVisible).toBe(false);
    expect(result.current.showAnswerBox).toBe(false);
  });

  it("Type answer reveals the answer box and Submit", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    act(() => result.current.onTypeAnswer());

    expect(result.current.showAnswerBox).toBe(true);
    expect(result.current.submitVisible).toBe(true);
    expect(result.current.speakAnswerVisible).toBe(false);
    expect(result.current.typeAnswerVisible).toBe(false);
  });

  it("submits a typed AnswerSubmission from the answer box", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onTypeAnswer());
    act(() => result.current.onDraftChange("東京で日本語を勉強したいです。"));
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledWith({
      inputMode: "typed",
      transcript: "東京で日本語を勉強したいです。",
    });
  });

  it("empty Speak answer submit opens the answer box instead of advancing", () => {
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
    expect(result.current.showAnswerBox).toBe(true);
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

  it("listening is true after Speak answer while the mic is on", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.listening).toBe(false);

    act(() => result.current.onSpeakAnswer());

    expect(result.current.listening).toBe(true);
    expect(result.current.speakAnswerVisible).toBe(false);
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

  it("submits a voice AnswerSubmission from the live caption", () => {
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
        inputMode: "voice",
        transcript: "こんにちは",
        audioClip: expect.any(Blob),
      }),
    );
  });

  it("resets Speak/Type choice when a new student turn becomes active", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAnswerCapture({
          active,
          micOn: true,
          onSubmit: vi.fn(),
        }),
      { initialProps: { active: true } },
    );

    act(() => result.current.onTypeAnswer());
    act(() => result.current.onDraftChange("途中の答え"));
    expect(result.current.showAnswerBox).toBe(true);

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current.showAnswerBox).toBe(false);
    expect(result.current.speakAnswerVisible).toBe(true);
    expect(result.current.draft).toBe("");
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

    expect(result.current.submitVisible).toBe(true);
    expect(result.current.speakAnswerVisible).toBe(false);
    expect(result.current.typeAnswerVisible).toBe(true);
  });

  it("submits the recorded audio clip from MediaRecorder on Speak submit", async () => {
    const recorded = new Blob([new Uint8Array([7, 7, 7])], { type: "audio/webm" });
    const stream = { getTracks: () => [{ stop: vi.fn() }] };

    class FakeMediaRecorder {
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn();
      stop = () => {
        this.ondataavailable?.({ data: recorded });
        this.onstop?.();
      };
      constructor(_stream: unknown) {}
    }

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

    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });

    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSpeakAnswer());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: true,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        inputMode: "voice",
        transcript: "こんにちは",
      }),
    );
    expect(onSubmit.mock.calls[0][0].audioClip).toBe(recorded);
  });

  it("does not keep the previous turn's audio clip after the student turn resets", async () => {
    const recorded = new Blob([new Uint8Array([7, 7, 7])], { type: "audio/webm" });
    class FakeMediaRecorder {
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn();
      stop = () => {
        this.ondataavailable?.({ data: recorded });
        this.onstop?.();
      };
      constructor(_stream: unknown) {}
    }

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

    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi
          .fn()
          .mockResolvedValueOnce({
            getTracks: () => [{ stop: vi.fn() }],
          })
          .mockReturnValueOnce(new Promise(() => {})),
      },
    });

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
        results: [Object.assign([{ transcript: "Q1" }], { isFinal: true })],
      });
    });
    act(() => result.current.onSubmitClick());
    expect(onSubmit.mock.calls[0][0].audioClip).toBe(recorded);

    rerender({ active: false });
    created.length = 0;
    rerender({ active: true });

    act(() => result.current.onSpeakAnswer());
    act(() => {
      created[0]?.onresult?.({
        results: [Object.assign([{ transcript: "Q2" }], { isFinal: true })],
      });
    });
    act(() => result.current.onSubmitClick());

    expect(onSubmit.mock.calls[1][0].transcript).toBe("Q2");
    expect(onSubmit.mock.calls[1][0].audioClip).not.toBe(recorded);
  });
});
