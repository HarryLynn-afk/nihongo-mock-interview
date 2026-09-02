import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useBackgroundScribe } from "./useBackgroundScribe";
import type { StoredAnswer } from "./useQuestionFlow";

describe("useBackgroundScribe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not call /api/scribe for typed answers", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const answers: StoredAnswer[] = [
      { questionIndex: 0, inputMode: "typed", transcript: "はい。", pushbackCount: 0, forced: false },
    ];

    renderHook(() =>
      useBackgroundScribe({ answers, phase: "senseiSpeaking" }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts each spoken answer's audio clip to /api/scribe immediately", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ transcript: "SCRIBE_TEXT" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const clip = new Blob([new Uint8Array([9, 9, 9])], { type: "audio/webm" });
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        inputMode: "voice",
        transcript: "こんにちは",
        audioClip: clip,
        pushbackCount: 0,
        forced: false,
      },
    ];

    const { result } = renderHook(() =>
      useBackgroundScribe({ answers, phase: "senseiSpeaking" }),
    );

    expect(result.current.status).toBe("collecting");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/scribe",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("audio")).toBeInstanceOf(Blob);
  });

  it("becomes ready immediately after Q3 when every answer was typed", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        inputMode: "typed",
        transcript: "a",
        pushbackCount: 0,
        forced: false,
      },
      {
        questionIndex: 1,
        inputMode: "typed",
        transcript: "b",
        pushbackCount: 1,
        forced: false,
      },
      {
        questionIndex: 2,
        inputMode: "typed",
        transcript: "c",
        pushbackCount: 2,
        forced: true,
      },
    ];

    const { result } = renderHook(() =>
      useBackgroundScribe({ answers, phase: "done" }),
    );

    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          inputMode: "typed",
          transcript: "a",
          useSubmittedTranscript: true,
          pushbackCount: 0,
          forced: false,
        },
        {
          questionIndex: 1,
          inputMode: "typed",
          transcript: "b",
          useSubmittedTranscript: true,
          pushbackCount: 1,
          forced: false,
        },
        {
          questionIndex: 2,
          inputMode: "typed",
          transcript: "c",
          useSubmittedTranscript: true,
          pushbackCount: 2,
          forced: true,
        },
      ],
    });
  });

  it("after Q3, waits for in-flight Scribe then uses that transcript", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        inputMode: "voice",
        transcript: "WISPR",
        audioClip: new Blob([new Uint8Array([1])], { type: "audio/webm" }),
        pushbackCount: 0,
        forced: false,
      },
    ];

    const { result } = renderHook(() =>
      useBackgroundScribe({ answers, phase: "done" }),
    );

    expect(result.current.status).toBe("collecting");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ transcript: "SCRIBE" }), { status: 200 }),
      );
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "ready",
        answers: [
          {
            questionIndex: 0,
            inputMode: "voice",
            transcript: "SCRIBE",
            useSubmittedTranscript: false,
            pushbackCount: 0,
            forced: false,
          },
        ],
      });
    });
  });

  it("after Q3, drops late Scribe jobs after a bounded wait and uses the submitted transcript", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        inputMode: "voice",
        transcript: "WISPR",
        audioClip: new Blob([new Uint8Array([1])], { type: "audio/webm" }),
        pushbackCount: 0,
        forced: false,
      },
    ];

    const { result } = renderHook(() =>
      useBackgroundScribe({
        answers,
        phase: "done",
        finishWaitMs: 5_000,
      }),
    );

    expect(result.current.status).toBe("collecting");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_999);
    });
    expect(result.current.status).toBe("collecting");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          inputMode: "voice",
          transcript: "WISPR",
          useSubmittedTranscript: true,
          pushbackCount: 0,
          forced: false,
        },
      ],
    });
  });

  it("does not call /api/scribe for an empty spoken clip and falls back after Q3", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        inputMode: "voice",
        transcript: "WISPR",
        audioClip: new Blob(),
        pushbackCount: 0,
        forced: false,
      },
    ];

    const { result } = renderHook(() =>
      useBackgroundScribe({ answers, phase: "done" }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          inputMode: "voice",
          transcript: "WISPR",
          useSubmittedTranscript: true,
          pushbackCount: 0,
          forced: false,
        },
      ],
    });
  });

  it("does not replace the submitted transcript with a Scribe result that arrives after the drop", async () => {
    vi.useFakeTimers();
    let resolveFetch: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        inputMode: "voice",
        transcript: "WISPR",
        audioClip: new Blob([new Uint8Array([1])], { type: "audio/webm" }),
        pushbackCount: 0,
        forced: false,
      },
    ];

    const { result } = renderHook(() =>
      useBackgroundScribe({
        answers,
        phase: "done",
        finishWaitMs: 5_000,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          inputMode: "voice",
          transcript: "WISPR",
          useSubmittedTranscript: true,
          pushbackCount: 0,
          forced: false,
        },
      ],
    });

    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ transcript: "LATE" }), { status: 200 }),
      );
    });

    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          inputMode: "voice",
          transcript: "WISPR",
          useSubmittedTranscript: true,
          pushbackCount: 0,
          forced: false,
        },
      ],
    });
  });
});
