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
});
