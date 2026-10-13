import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SURVEY_SUBMIT_TIMEOUT_MS,
  submitSurveyAnswers,
} from "./submitSurveyAnswers";
import type { SurveyPayload } from "@/lib/content/survey";

const survey: SurveyPayload = { skipped: true };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("submitSurveyAnswers", () => {
  it("reports submitted on 202", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 202 })),
    );

    await expect(
      submitSurveyAnswers({ attemptToken: "t", survey }),
    ).resolves.toBe("submitted");
  });

  it("keeps retry when the route has not saved the attempt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "not saved" }), { status: 409 }),
      ),
    );

    await expect(
      submitSurveyAnswers({ attemptToken: "t", survey }),
    ).resolves.toBe("retry");
  });

  it("reports an uncertain delivery on an unexpected 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "uncertain" }), { status: 409 }),
      ),
    );

    await expect(
      submitSurveyAnswers({ attemptToken: "t", survey }),
    ).resolves.toBe("uncertain");
  });

  it("reports retry on a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    await expect(
      submitSurveyAnswers({ attemptToken: "t", survey }),
    ).resolves.toBe("retry");
  });

  it("reports an uncertain delivery when the submission stalls past the deadline", async () => {
    vi.useFakeTimers();
    const stalled = vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        );
      }),
    );
    vi.stubGlobal("fetch", stalled);

    let outcome: string | null = null;
    void submitSurveyAnswers({ attemptToken: "t", survey }).then((value) => {
      outcome = value;
    });

    await vi.advanceTimersByTimeAsync(SURVEY_SUBMIT_TIMEOUT_MS);

    expect(outcome).toBe("uncertain");
    expect((stalled.mock.calls[0][1] as RequestInit | undefined)?.signal).toBeDefined();
  });
});
