import { describe, expect, it, vi } from "vitest";
import { postSurvey } from "./postSurvey";
import type { SurveyPayload } from "@/lib/content/survey";

const skipPayload: SurveyPayload = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  headline: "AlmostReady",
  total: 70,
  source: "live",
  answers: [
    { questionIndex: 0, pushbackCount: 0, forced: false },
    { questionIndex: 1, pushbackCount: 1, forced: false },
    { questionIndex: 2, pushbackCount: 2, forced: true },
  ],
  skipped: true,
};

describe("postSurvey", () => {
  it("POSTs the payload to the form URL", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await postSurvey({
      url: "https://example.com/formResponse",
      payload: skipPayload,
      fetchImpl: fakeFetch,
    });

    expect(fakeFetch).toHaveBeenCalledWith(
      "https://example.com/formResponse",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends session id, Headline, total, live/sample, Pushback, and skipped as form fields", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await postSurvey({
      url: "https://example.com/formResponse",
      payload: skipPayload,
      fetchImpl: fakeFetch,
    });

    const init = fakeFetch.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
    const params = new URLSearchParams(String(init.body));
    expect(params.get("entry.1571804127")).toBe(skipPayload.sessionId);
    expect(params.get("entry.118245774")).toBe("AlmostReady");
    expect(params.get("entry.629201507")).toBe("70");
    expect(params.get("entry.1636094148")).toBe("live");
    expect(params.get("entry.820831902")).toBe("0");
    expect(params.get("entry.1351365414")).toBe("false");
    expect(params.get("entry.1200746092")).toBe("1");
    expect(params.get("entry.550204019")).toBe("false");
    expect(params.get("entry.1832827395")).toBe("2");
    expect(params.get("entry.833059275")).toBe("true");
    expect(params.get("entry.414556491")).toBe("true");
    expect(params.get("entry.56970328")).toBe("");
    expect(params.get("entry.589615942")).toBe("");
    expect(params.get("entry.1855296635")).toBe("");
    expect(params.get("entry.sessionId")).toBeNull();
  });

  it("sends usefulness, usability, and comment on Submit", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const payload: SurveyPayload = {
      ...skipPayload,
      skipped: false,
      usefulness: 4,
      usability: 5,
      comment: "Clear rewrite.",
    };

    await postSurvey({
      url: "https://example.com/formResponse",
      payload,
      fetchImpl: fakeFetch,
    });

    const params = new URLSearchParams(
      String((fakeFetch.mock.calls[0][1] as RequestInit).body),
    );
    expect(params.get("entry.414556491")).toBe("false");
    expect(params.get("entry.56970328")).toBe("4");
    expect(params.get("entry.589615942")).toBe("5");
    expect(params.get("entry.1855296635")).toBe("Clear rewrite.");
  });

  it("never throws even when fetch rejects", async () => {
    const fakeFetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      postSurvey({
        url: "https://example.com/formResponse",
        payload: skipPayload,
        fetchImpl: fakeFetch,
      }),
    ).resolves.toBeUndefined();
  });
});
