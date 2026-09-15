import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDeliverySignals } from "./useDeliverySignals";
import type { StoredAnswer } from "./useQuestionFlow";
import { notAssessedClip } from "@/lib/content/deliverySignals";

describe("useDeliverySignals", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("marks an empty clip as not assessed without decoding", async () => {
    const analyzeClip = vi.fn();
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
      useDeliverySignals({ answers, phase: "done", analyzeClip }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(analyzeClip).not.toHaveBeenCalled();
    if (result.current.status === "ready") {
      expect(result.current.delivery.status).toBe("notAssessed");
    }
  });

  it("analyzes each spoken clip once", async () => {
    const analyzeClip = vi.fn().mockResolvedValue({
      recordingQuality: "pass",
      durationSec: 2,
      speechRateCps: 4,
      longPauseCount: 0,
      fillerCount: 0,
      observations: ["Answer lasted 2 seconds."],
    });
    const clip = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        status: "answered",
        transcript: "はじめまして",
        audioClip: clip,
        pushbackCount: 0,
      },
    ];

    const { result } = renderHook(() =>
      useDeliverySignals({ answers, phase: "done", analyzeClip }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(analyzeClip).toHaveBeenCalledTimes(1);
    if (result.current.status === "ready") {
      expect(result.current.delivery.status).toBe("clearEnough");
    }
  });

  it("fail-opens to not assessed after the finish wait", async () => {
    vi.useFakeTimers();
    const analyzeClip = vi.fn().mockReturnValue(new Promise(() => {}));
    const answers: StoredAnswer[] = [
      {
        questionIndex: 0,
        status: "answered",
        transcript: "はい",
        audioClip: new Blob([new Uint8Array([1])], { type: "audio/webm" }),
        pushbackCount: 0,
      },
    ];

    const { result } = renderHook(() =>
      useDeliverySignals({
        answers,
        phase: "done",
        analyzeClip,
        finishWaitMs: 3_000,
      }),
    );

    expect(result.current.status).toBe("collecting");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.delivery.answers[0]).toMatchObject(notAssessedClip());
    }
  });
});
