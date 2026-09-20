import { describe, expect, it } from "vitest";
import type { InterviewReport } from "./sampleReport";
import { getSampleReport } from "./sampleReport";
import { buildSurveyPayload, buildUsefulnessView, createSessionId } from "./survey";

describe("buildUsefulnessView", () => {
  it("returns null in Pitch mode even when the form is enabled and reveal is done", () => {
    expect(
      buildUsefulnessView({
        isPitchMode: true,
        formEnabled: true,
        revealDone: true,
        sessionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBeNull();
  });

  it("returns a view with the session id after reveal when the form is enabled", () => {
    const sessionId = "11111111-1111-4111-8111-111111111111";
    const view = buildUsefulnessView({
      isPitchMode: false,
      formEnabled: true,
      revealDone: true,
      sessionId,
    });

    expect(view?.sessionId).toBe(sessionId);
  });

  it("returns null when the form URL is missing", () => {
    expect(
      buildUsefulnessView({
        isPitchMode: false,
        formEnabled: false,
        revealDone: true,
        sessionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBeNull();
  });

  it("returns null before the report reveal finishes", () => {
    expect(
      buildUsefulnessView({
        isPitchMode: false,
        formEnabled: true,
        revealDone: false,
        sessionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBeNull();
  });

  it("includes the locked EN and MY survey copy", () => {
    const view = buildUsefulnessView({
      isPitchMode: false,
      formEnabled: true,
      revealDone: true,
      sessionId: "11111111-1111-4111-8111-111111111111",
    });

    expect(view?.copy.consent.english).toBe(
      "Your ratings help a CSC 485 research study on AI interview feedback. Answers are anonymous and optional.",
    );
    expect(view?.copy.consent.burmese).toBe(
      "သင့်အဆင့်သတ်မှတ်ချက်များသည် CSC 485 သုတေသနလေ့လာမှုအတွက် အသုံးပြုပါမည်။ အမည်မဖော်ပြပါ၊ ဖြေရန်မလိုအပ်ပါ။",
    );
    expect(view?.copy.usefulness.english).toBe(
      "How useful was this feedback for improving your interview answers?",
    );
    expect(view?.copy.usability.english).toBe(
      "How easy was this practice session to use?",
    );
    expect(view?.copy.skip.english).toBe("Skip");
    expect(view?.copy.skip.burmese).toBe("ကျော်မည်");
  });
});

const groqReport: InterviewReport = {
  ...getSampleReport(null),
  headline: "AlmostReady",
  stamp: "もう少し",
  total: 70,
  source: "grade",
};

const surveyAnswers = [
  { questionIndex: 0 as const, pushbackCount: 0 as const, forced: false },
  { questionIndex: 1 as const, pushbackCount: 1 as const, forced: false },
  { questionIndex: 2 as const, pushbackCount: 2 as const, forced: true },
];

describe("buildSurveyPayload", () => {
  it("on Skip includes session id, Headline, total, live source, and per-Question Pushback without ratings", () => {
    const payload = buildSurveyPayload({
      report: groqReport,
      answers: surveyAnswers,
      sessionId: "11111111-1111-4111-8111-111111111111",
      outcome: { skipped: true },
    });

    expect(payload).toEqual({
      sessionId: "11111111-1111-4111-8111-111111111111",
      headline: "AlmostReady",
      total: 70,
      source: "live",
      answers: surveyAnswers,
      skipped: true,
    });
    expect(payload).not.toHaveProperty("usefulness");
    expect(payload).not.toHaveProperty("usability");
  });

  it("on Submit includes both 1-5 ratings and the optional comment", () => {
    const payload = buildSurveyPayload({
      report: groqReport,
      answers: surveyAnswers,
      sessionId: "11111111-1111-4111-8111-111111111111",
      outcome: {
        skipped: false,
        usefulness: 4,
        usability: 5,
        comment: "Clear rewrite.",
      },
    });

    expect(payload).toEqual({
      sessionId: "11111111-1111-4111-8111-111111111111",
      headline: "AlmostReady",
      total: 70,
      source: "live",
      answers: surveyAnswers,
      skipped: false,
      usefulness: 4,
      usability: 5,
      comment: "Clear rewrite.",
    });
  });

  it("stores a blank comment as null", () => {
    const payload = buildSurveyPayload({
      report: groqReport,
      answers: surveyAnswers,
      sessionId: "11111111-1111-4111-8111-111111111111",
      outcome: {
        skipped: false,
        usefulness: 3,
        usability: 3,
        comment: "   ",
      },
    });

    expect(payload.skipped).toBe(false);
    if (!payload.skipped) {
      expect(payload.comment).toBeNull();
    }
  });

  it("keeps dual-fail source as sample, not live", () => {
    const payload = buildSurveyPayload({
      report: getSampleReport("Scoring unavailable — sample report."),
      answers: surveyAnswers,
      sessionId: "11111111-1111-4111-8111-111111111111",
      outcome: { skipped: true },
    });

    expect(payload.source).toBe("sample");
    expect(payload.headline).toBe("Ready");
  });
});

describe("createSessionId", () => {
  it("returns a G- code for a Guest, not a UUID", () => {
    const id = createSessionId("guest");
    expect(id).toMatch(/^G-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("returns a P- code for a Participant, not a UUID", () => {
    const id = createSessionId("participant");
    expect(id).toMatch(/^P-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("returns a different Guest code on each call", () => {
    const id = createSessionId("guest");
    expect(createSessionId("guest")).not.toBe(id);
  });
});
