import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInterviewScore } from "./useInterviewScore";
import type { ScribeCollection } from "./useBackgroundScribe";

describe("useInterviewScore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not POST /api/score while Scribe is still collecting", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const collection: ScribeCollection = { status: "collecting" };
    renderHook(() => useInterviewScore(collection));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs /api/score once when Scribe becomes ready, with GradeAnswer fields only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ report: { headline: "Ready" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const collection: ScribeCollection = {
      status: "ready",
      answers: [
        {
          questionIndex: 0,
          inputMode: "voice",
          transcript: "SCRIBE_TEXT",
          useSubmittedTranscript: false,
        },
        {
          questionIndex: 1,
          inputMode: "typed",
          transcript: "はい。",
          useSubmittedTranscript: true,
        },
      ],
    };

    const { rerender } = renderHook(
      (props: { collection: ScribeCollection }) =>
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
              inputMode: "voice",
              transcript: "SCRIBE_TEXT",
            },
            {
              questionIndex: 1,
              inputMode: "typed",
              transcript: "はい。",
            },
          ],
        }),
      }),
    );
  });
});
