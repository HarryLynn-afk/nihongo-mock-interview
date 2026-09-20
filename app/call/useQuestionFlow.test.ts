import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { questions } from "@/lib/content/questions";
import { pickSessionQuestions } from "@/lib/content/questionBank";
import { useQuestionFlow } from "./useQuestionFlow";
import type { AnswerSubmission } from "./useQuestionFlow";

const answered = (transcript = "ok"): AnswerSubmission => ({
  status: "answered",
  transcript,
  audioClip: new Blob(),
  pushbackCount: 0,
});

const skipped = (): AnswerSubmission => ({ status: "skipped" });

describe("useQuestionFlow", () => {
  it("advances Q1 → Q2 → Q3 → done in order without repeating or skipping", () => {
    const { result } = renderHook(() => useQuestionFlow());

    expect(result.current.phase).toBe("senseiSpeaking");
    expect(result.current.currentQuestion).toBe(questions[0]);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    expect(result.current.currentQuestion).toBe(questions[1]);
    expect(result.current.phase).toBe("senseiSpeaking");

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    expect(result.current.currentQuestion).toBe(questions[2]);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
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
    act(() => result.current.submitAnswer(answered()));

    expect(result.current.phase).toBe("senseiSpeaking");
    expect(result.current.currentQuestion).toBe(questions[1]);
  });

  it("submitAnswer stores an answered AnswerSubmission for the current Question and advances", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() =>
      result.current.submitAnswer({
        status: "answered",
        transcript: "はじめまして。アウンミンハントです。",
        audioClip: new Blob(),
        pushbackCount: 0,
      }),
    );

    expect(result.current.answers).toEqual([
      {
        questionIndex: 0,
        questionId: 1,
        isFollowUp: false,
        status: "answered",
        transcript: "はじめまして。アウンミンハントです。",
        audioClip: expect.any(Blob),
        pushbackCount: 0,
      },
    ]);
    expect(result.current.currentQuestion).toBe(questions[1]);
    expect(result.current.phase).toBe("senseiSpeaking");
  });

  it("submitAnswer stores a skipped AnswerSubmission and advances without a transcript", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(skipped()));

    expect(result.current.answers).toEqual([
      {
        questionIndex: 0,
        questionId: 1,
        isFollowUp: false,
        status: "skipped",
      },
    ]);
    expect(result.current.currentQuestion).toBe(questions[1]);
    expect(result.current.phase).toBe("senseiSpeaking");
  });

  it("never triggers a fourth question if submitAnswer is called after done", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    // Extra call after done — should be a no-op, never advance beyond done.
    act(() => result.current.submitAnswer(answered()));

    expect(result.current.phase).toBe("done");
    expect(result.current.currentQuestion).toBeNull();
  });

  it("submitAnswer during senseiSpeaking is a no-op", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.submitAnswer(answered()));

    expect(result.current.phase).toBe("senseiSpeaking");
    expect(result.current.currentQuestion).toBe(questions[0]);
  });

  it("stores one answer when submitAnswer is called twice before re-render", () => {
    const { result } = renderHook(() => useQuestionFlow());

    act(() => result.current.endSenseiTurn());
    act(() => {
      result.current.submitAnswer(answered("こんにちは。"));
      result.current.submitAnswer(answered("こんにちは。"));
    });

    expect(result.current.answers).toHaveLength(1);
    expect(result.current.answers[0]).toMatchObject({
      questionIndex: 0,
      questionId: questions[0].id,
      status: "answered",
      transcript: "こんにちは。",
    });
    expect(result.current.currentQuestion).toBe(questions[1]);
    expect(result.current.phase).toBe("senseiSpeaking");
  });

  it("inserts a follow-up after a vague practice answer", () => {
    const session = pickSessionQuestions(() => 0);
    const { result } = renderHook(() =>
      useQuestionFlow(session, { enableFollowUps: true }),
    );

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered("はい、そうです。")));

    expect(result.current.sessionQuestions.length).toBeGreaterThan(session.length);
    expect(result.current.currentQuestion?.id).toBeGreaterThanOrEqual(200);
  });

  it("does not insert a follow-up after a skipped Question", () => {
    const session = pickSessionQuestions(() => 0);
    const { result } = renderHook(() =>
      useQuestionFlow(session, { enableFollowUps: true }),
    );

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(skipped()));

    expect(result.current.sessionQuestions.length).toBe(session.length);
  });

  it("exposes questionIndex 0/1/2 then null when done", () => {
    const { result } = renderHook(() => useQuestionFlow());

    expect(result.current.questionIndex).toBe(0);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    expect(result.current.questionIndex).toBe(1);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    expect(result.current.questionIndex).toBe(2);

    act(() => result.current.endSenseiTurn());
    act(() => result.current.submitAnswer(answered()));
    expect(result.current.questionIndex).toBeNull();
  });
});
