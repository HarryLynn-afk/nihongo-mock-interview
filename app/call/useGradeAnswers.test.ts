import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { questions } from "@/lib/content/questions";
import { questionBank } from "@/lib/content/questionBank";
import { useGradeAnswers } from "./useGradeAnswers";
import type { StoredAnswer } from "./useQuestionFlow";

describe("useGradeAnswers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the Japanese question and topic to each graded answer", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        questionId: 1,
        status: "answered",
        transcript: "SUBMITTED",
        pushbackCount: 0,
      },
      { questionIndex: 1, questionId: 2, status: "skipped" },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({ answers, phase: "done" }),
    );

    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          questionId: 1,
          topic: "selfIntroduction",
          questionJapanese: questions[0].japanese,
          transcript: "SUBMITTED",
          pushbackCount: 0,
        },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the topic bank for a practice Question", () => {
    const bankQuestion = questionBank.find(
      (question) => question.topic === "financialSupport",
    );
    if (!bankQuestion) throw new Error("missing financialSupport question");

    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        questionId: bankQuestion.id,
        status: "answered",
        transcript: "アルバイトをします。",
        pushbackCount: 1,
      },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({
        answers,
        phase: "done",
        sessionQuestions: [bankQuestion],
      }),
    );

    expect(result.current).toEqual({
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          questionId: bankQuestion.id,
          topic: "financialSupport",
          questionJapanese: bankQuestion.japanese,
          transcript: "アルバイトをします。",
          pushbackCount: 1,
        },
      ],
    });
  });

  it("drops an answer whose question is not in the session", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        questionId: 999,
        status: "answered",
        transcript: "SUBMITTED",
        pushbackCount: 0,
      },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({ answers, phase: "done", sessionQuestions: [] }),
    );

    expect(result.current).toEqual({ status: "ready", answers: [] });
  });

  it("stays collecting before the Interview is done", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        questionId: 1,
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
      { questionIndex: 0, questionId: 1, status: "skipped" },
      { questionIndex: 1, questionId: 2, status: "skipped" },
      { questionIndex: 2, questionId: 3, status: "skipped" },
    ];

    const { result } = renderHook(() =>
      useGradeAnswers({ answers, phase: "done" }),
    );

    expect(result.current).toEqual({ status: "ready", answers: [] });
  });
});
