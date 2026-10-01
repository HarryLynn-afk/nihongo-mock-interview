import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInterviewScore } from "./useInterviewScore";
import type { GradeCollection } from "./useGradeAnswers";

const FIRST_ANSWER = {
  questionIndex: 0,
  questionId: 1,
  topic: "selfIntroduction",
  questionJapanese: "はじめに、簡単に自己紹介をお願いします。",
  transcript: "SUBMITTED_0",
  pushbackCount: 0,
};

const SECOND_ANSWER = {
  questionIndex: 1,
  questionId: 2,
  topic: "motivationJapan",
  questionJapanese:
    "どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。",
  transcript: "はい。",
  pushbackCount: 1,
};

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

  it("POSTs /api/score once when answers become ready, with the question context only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ report: { total: 88, source: "grade" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const collection: GradeCollection = {
      status: "ready",
      answers: [FIRST_ANSWER, SECOND_ANSWER],
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
          answers: [FIRST_ANSWER, SECOND_ANSWER],
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
      answers: [{ ...FIRST_ANSWER, transcript: "はい。" }],
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
      answers: [{ ...FIRST_ANSWER, transcript: "はい。" }],
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
      answers: [{ ...FIRST_ANSWER, transcript: "はい。" }],
    };

    const { result } = renderHook(() => useInterviewScore(collection));

    await waitFor(() => {
      expect(result.current.report).toBeNull();
      expect(result.current.scoringFailed).toBe(true);
    });
  });
});
