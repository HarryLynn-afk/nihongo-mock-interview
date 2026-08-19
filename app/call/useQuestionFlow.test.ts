import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { questions } from "@/lib/content/questions";
import { useQuestionFlow } from "./useQuestionFlow";
import type { AnswerSubmission } from "./useQuestionFlow";

const typed = (transcript = "ok"): AnswerSubmission => ({
  inputMode: "typed",
  transcript,
});

describe("useQuestionFlow", () => {
  it("advances Q1 → Q2 → Q3 → done in order without repeating or skipping", () => {
    const { result } = renderHook(() => useQuestionFlow());

    expect(result.current.phase).toBe("senseiSpeaking");
    expect(result.current.currentQuestion).toBe(questions[0]);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    expect(result.current.currentQuestion).toBe(questions[1]);
    expect(result.current.phase).toBe("senseiSpeaking");

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    expect(result.current.currentQuestion).toBe(questions[2]);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    expect(result.current.phase).toBe("done");
    expect(result.current.currentQuestion).toBeNull();
  });

  it("endSenseiTurn moves to studentAnswering without changing the current Question", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());

    expect(result.current.phase).toBe("studentAnswering");
    expect(result.current.currentQuestion).toBe(questions[0]);
  });

  it("submitAnswer after the student turn starts the next Question in senseiSpeaking", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));

    expect(result.current.phase).toBe("senseiSpeaking");
    expect(result.current.currentQuestion).toBe(questions[1]);
  });

  it("submitAnswer stores a typed AnswerSubmission for the current Question and advances", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() =>
      result.current.submitAnswer({
        inputMode: "typed",
        transcript: "はじめまして。アウンミンハントです。",
      }),
    );

    expect(result.current.answers).toEqual([
      {
        questionIndex: 0,
        inputMode: "typed",
        transcript: "はじめまして。アウンミンハントです。",
      },
    ]);
    expect(result.current.currentQuestion).toBe(questions[1]);
    expect(result.current.phase).toBe("senseiSpeaking");
  });

  it("never triggers a fourth question if submitAnswer is called after done", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    // Extra call after done — should be a no-op, never advance beyond done.
    act(() => result.current.submitAnswer(typed()));

    expect(result.current.phase).toBe("done");
    expect(result.current.currentQuestion).toBeNull();
  });

  it("submitAnswer during senseiSpeaking is a no-op", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.submitAnswer(typed()));

    expect(result.current.phase).toBe("senseiSpeaking");
    expect(result.current.currentQuestion).toBe(questions[0]);
  });

  it("exposes questionIndex 0/1/2 then null when done", () => {
    const { result } = renderHook(() => useQuestionFlow());

    expect(result.current.questionIndex).toBe(0);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    expect(result.current.questionIndex).toBe(1);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    expect(result.current.questionIndex).toBe(2);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(typed()));
    expect(result.current.questionIndex).toBeNull();
  });
});
