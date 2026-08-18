import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAnswerCapture } from "./useAnswerCapture";

describe("useAnswerCapture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the answer box by default when the mic is off", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: false,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.showAnswerBox).toBe(true);
    expect(result.current.typeInsteadVisible).toBe(false);
  });

  it("Type instead is visible while mic is on, and reveals the answer box", () => {
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit: vi.fn(),
      }),
    );

    expect(result.current.typeInsteadVisible).toBe(true);
    expect(result.current.showAnswerBox).toBe(false);

    act(() => result.current.onTypeInstead());

    expect(result.current.showAnswerBox).toBe(true);
    expect(result.current.typeInsteadVisible).toBe(false);
  });

  it("submits a typed AnswerSubmission from the answer box", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: false,
        onSubmit,
      }),
    );

    act(() => result.current.onDraftChange("東京で日本語を勉強したいです。"));
    act(() => result.current.onSubmitClick());

    expect(onSubmit).toHaveBeenCalledWith({
      inputMode: "typed",
      transcript: "東京で日本語を勉強したいです。",
    });
  });

  it("empty voice submit opens the answer box instead of advancing", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useAnswerCapture({
        active: true,
        micOn: true,
        onSubmit,
      }),
    );

    act(() => result.current.onSubmitClick());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.showAnswerBox).toBe(true);
  });

  it("updates the live Japanese caption from browser speech while the mic is on", () => {
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

    expect(created[0]?.start).toHaveBeenCalled();
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
        audioClip:       expect.any(Blob),
      }),
    );
  });

  it("resets the type box when a new student turn becomes active", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        useAnswerCapture({
          active,
          micOn: true,
          onSubmit: vi.fn(),
        }),
      { initialProps: { active: true } },
    );

    act(() => result.current.onTypeInstead());
    act(() => result.current.onDraftChange("途中の答え"));
    expect(result.current.showAnswerBox).toBe(true);

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current.showAnswerBox).toBe(false);
    expect(result.current.draft).toBe("");
  });
});
