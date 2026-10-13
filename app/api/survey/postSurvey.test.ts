import { describe, expect, it, vi } from "vitest";
import { SURVEY_FORWARD_TIMEOUT_MS, postSurvey } from "./postSurvey";
import type { SurveyPayload } from "@/lib/content/survey";

const submitPayload: SurveyPayload = {
  skipped: false,
  ratings: {
    improveUnderstanding: 5,
    identifyWeaknesses: 4,
    rewriteUseful: 5,
    useAgain: 4,
    easyToUse: 5,
    clearSteps: 4,
    reportClear: 5,
    completeEasily: 4,
    transcriptAccurate: 3,
    feedbackConsistent: 4,
  },
  openEnded: {
    mostHelpful: "The rewrite.",
    unclear: "Nothing.",
    improvement: "More questions.",
  },
};

describe("postSurvey", () => {
  it("reports an upstream HTTP failure", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(postSurvey({
      url: "https://example.com/formResponse",
      payload: submitPayload,
      fetchImpl: fakeFetch,
    })).rejects.toThrow("Survey delivery failed");
  });

  it("POSTs the payload to the form URL as form-urlencoded", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await postSurvey({
      url: "https://example.com/formResponse",
      payload: submitPayload,
      fetchImpl: fakeFetch,
    });

    expect(fakeFetch).toHaveBeenCalledWith(
      "https://example.com/formResponse",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    );
  });

  it("maps every rating and open-ended answer onto its entry id", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await postSurvey({
      url: "https://example.com/formResponse",
      payload: submitPayload,
      fetchImpl: fakeFetch,
    });

    const params = new URLSearchParams(
      String((fakeFetch.mock.calls[0][1] as RequestInit).body),
    );
    expect(params.get("entry.56970328")).toBe("5");
    expect(params.get("entry.1117609917")).toBe("4");
    expect(params.get("entry.1584949759")).toBe("5");
    expect(params.get("entry.580383874")).toBe("4");
    expect(params.get("entry.2078568494")).toBe("5");
    expect(params.get("entry.1587213975")).toBe("4");
    expect(params.get("entry.649058710")).toBe("5");
    expect(params.get("entry.1140789477")).toBe("4");
    expect(params.get("entry.535422587")).toBe("3");
    expect(params.get("entry.793287150")).toBe("4");
    expect(params.get("entry.740580120")).toBe("The rewrite.");
    expect(params.get("entry.589615942")).toBe("Nothing.");
    expect(params.get("entry.1855296635")).toBe("More questions.");
  });

  it("sends no entry fields on Skip", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await postSurvey({
      url: "https://example.com/formResponse",
      payload: { skipped: true },
      fetchImpl: fakeFetch,
    });

    const params = new URLSearchParams(
      String((fakeFetch.mock.calls[0][1] as RequestInit).body),
    );
    expect([...params.keys()]).toEqual([]);
  });

  it("reports a network failure", async () => {
    const fakeFetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      postSurvey({
        url: "https://example.com/formResponse",
        payload: submitPayload,
        fetchImpl: fakeFetch,
      }),
    ).rejects.toThrow("network down");
  });

  it("aborts a stalled forwarding request at the deadline", async () => {
    vi.useFakeTimers();
    try {
      const fakeFetch = vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          );
        }),
      );
      let outcome: "resolved" | "rejected" | null = null;
      const attempt = postSurvey({
        url: "https://example.com/formResponse",
        payload: submitPayload,
        fetchImpl: fakeFetch as unknown as typeof fetch,
      });
      attempt.then(
        () => { outcome = "resolved"; },
        () => { outcome = "rejected"; },
      );

      await vi.advanceTimersByTimeAsync(SURVEY_FORWARD_TIMEOUT_MS);

      expect(outcome).toBe("rejected");
      await attempt.catch(() => {});
    } finally {
      vi.useRealTimers();
    }
  });
});
