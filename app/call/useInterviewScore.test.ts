import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInterviewScore } from "./useInterviewScore";
import type { GradeCollection } from "./useGradeAnswers";

describe("useInterviewScore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not POST /api/score while answers are still collecting", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const collection: GradeCollection = { status: "collecting" };
    renderHook(() => useInterviewScore(collection));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not POST /api/score when every Question was skipped", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const collection: GradeCollection = { status: "ready", answers: [] };
    renderHook(() => useInterviewScore(collection));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs /api/score once when answers become ready, with GradeAnswer fields only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ report: { total: 88, source: "grade" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const collection: GradeCollection = {
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          transcript: "SUBMITTED_0",
          pushbackCount: 0,
        },
        {
          questionIndex: 1,
          transcript: "はい。",
          pushbackCount: 1,
        },
      ],
    };

    const { rerender } = renderHook(
      (props: { collection: GradeCollection }) =>
        useInterviewScore(props.collection),
      { initialProps: { collection } },
    );
    rerender({ collection });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/score",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionIndex: 0,
              transcript: "SUBMITTED_0",
              pushbackCount: 0,
            },
            {
              questionIndex: 1,
              transcript: "はい。",
              pushbackCount: 1,
            },
          ],
        }),
      }),
    );
  });

  it("keeps the { report } JSON from /api/score, including a dual-fail banner", async () => {
    const sampleReport = {
      total: 88,
      source: "sample",
      banner: "Scoring unavailable — sample report.",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ report: sampleReport }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const collection: GradeCollection = {
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          transcript: "はい。",
          pushbackCount: 0,
        },
      ],
    };

    const { result } = renderHook(() => useInterviewScore(collection));

    await waitFor(() => {
      expect(result.current.report).toEqual(sampleReport);
    });
  });

  it("keeps report null when /api/score fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const collection: GradeCollection = {
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          transcript: "はい。",
          pushbackCount: 0,
        },
      ],
    };

    const { result } = renderHook(() => useInterviewScore(collection));

    await waitFor(() => {
      expect(result.current.report).toBeNull();
      expect(result.current.scoringFailed).toBe(true);
    });
  });

  it("keeps report null when /api/score returns a null report", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ report: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const collection: GradeCollection = {
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          transcript: "はい。",
          pushbackCount: 0,
        },
      ],
    };

    const { result } = renderHook(() => useInterviewScore(collection));

    await waitFor(() => {
      expect(result.current.report).toBeNull();
      expect(result.current.scoringFailed).toBe(true);
    });
  });
});
