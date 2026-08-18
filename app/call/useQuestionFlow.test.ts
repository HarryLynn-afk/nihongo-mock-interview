import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { questions } from "@/lib/content/questions";
import { useQuestionFlow } from "./useQuestionFlow";

describe("useQuestionFlow", () => {
  it("advances Q1 → Q2 → Q3 → done in order without repeating or skipping", () => {
    const { result } = renderHook(() => useQuestionFlow());

    expect(result.current.phase).toBe("asking");
    expect(result.current.currentQuestion).toBe(questions[0]);

    act(() => result.current.submitAnswer());
    expect(result.current.currentQuestion).toBe(questions[1]);

    act(() => result.current.submitAnswer());
    expect(result.current.currentQuestion).toBe(questions[2]);

    act(() => result.current.submitAnswer());
    expect(result.current.phase).toBe("done");
    expect(result.current.currentQuestion).toBeNull();
  });

  it("never triggers a fourth question if submitAnswer is called after done", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.submitAnswer());
    act(() => result.current.submitAnswer());
    act(() => result.current.submitAnswer());
    // Extra call after done — should be a no-op, never advance beyond done.
    act(() => result.current.submitAnswer());

    expect(result.current.phase).toBe("done");
    expect(result.current.currentQuestion).toBeNull();
  });
});
