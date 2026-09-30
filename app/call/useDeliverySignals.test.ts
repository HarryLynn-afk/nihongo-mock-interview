import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDeliverySignals } from "./useDeliverySignals";
import type { StoredAnswer } from "./useQuestionFlow";

describe("useDeliverySignals", () => {
  it("is ready immediately after done when every Question was skipped", () => {
    const answers: StoredAnswer[] = [{ questionIndex: 0, status: "skipped" }];

    const { result } = renderHook(() =>
      useDeliverySignals({ answers, phase: "done" }),
    );

    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.delivery.status).toBe("unavailable");
    }
  });

  it("marks an empty clip with no timestamps as unable to assess", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        status: "answered",
        transcript: "はい",
        audioClip: new Blob(),
        pushbackCount: 0,
      },
    ];

    const { result } = renderHook(() =>
      useDeliverySignals({ answers, phase: "done" }),
    );

    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.delivery.status).toBe("unableToAssess");
      expect(result.current.delivery.answers[0]?.unableReason).toBe("empty");
    }
  });

  it("builds a review tip from word timings without PCM analysis", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 1,
        questionId: 2,
        status: "answered",
        transcript: "日本で勉強したいです",
        audioClip: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" }),
        pushbackCount: 0,
        wordTimings: [
          { word: "日本", start: 0, end: 0.3 },
          { word: "で", start: 3.1, end: 3.2 },
          { word: "勉強", start: 3.3, end: 3.6 },
        ],
      },
    ];

    const { result } = renderHook(() =>
      useDeliverySignals({ answers, phase: "done" }),
    );

    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.delivery.status).toBe("review");
      expect(result.current.delivery.tips[0]?.questionLabel).toBe(
        "Q2 · Motivation",
      );
      expect(result.current.delivery.tips[0]?.evidence).toMatch(
        /2\.8-second pause/i,
      );
    }
  });

  it("returns noIssue when word timings have no long mid-answer gap", () => {
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        questionId: 1,
        status: "answered",
        transcript: "はじめまして",
        audioClip: new Blob([new Uint8Array([1])], { type: "audio/wav" }),
        pushbackCount: 0,
        wordTimings: [
          { word: "はじめ", start: 0, end: 0.3 },
          { word: "まして", start: 0.4, end: 0.7 },
        ],
      },
    ];

    const { result } = renderHook(() =>
      useDeliverySignals({ answers, phase: "done" }),
    );

    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.delivery.status).toBe("noIssue");
    }
  });
});
