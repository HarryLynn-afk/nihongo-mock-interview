import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGradeAnswers } from "./useGradeAnswers";
import type { StoredAnswer } from "./useQuestionFlow";

describe("useGradeAnswers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("after Q3, is ready with submitted Speak transcripts and never calls fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        status: "answered",
        transcript: "SUBMITTED",
        pushbackCount: 0,
      },
      { questionIndex: 1, status: "skipped" },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({ answers, phase: "done" }),
    );

    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          transcript: "SUBMITTED",
          pushbackCount: 0,
        },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stays collecting before the Interview is done", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        status: "answered",
        transcript: "SUBMITTED",
        pushbackCount: 0,
      },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({ answers, phase: "senseiSpeaking" }),
    );

    expect(result.current).toEqual({ status: "collecting" });
  });

  it("is ready with an empty list when every Question was skipped", () => {
    const answers: StoredAnswer[] = [
      { questionIndex: 0, status: "skipped" },
      { questionIndex: 1, status: "skipped" },
      { questionIndex: 2, status: "skipped" },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({ answers, phase: "done" }),
    );

    expect(result.current).toEqual({ status: "ready", answers: [] });
  });
});
