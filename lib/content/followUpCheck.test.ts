import { describe, expect, it } from "vitest";
import { MAX_FOLLOW_UPS, shouldOfferFollowUp } from "./followUpCheck";

describe("shouldOfferFollowUp", () => {
  it("does not offer a follow-up after the cap", () => {
    expect(
      shouldOfferFollowUp({
        transcript: "はい、短いです。",
        topic: "studyPlan",
        followUpsUsed: MAX_FOLLOW_UPS,
      }),
    ).toBe(false);
  });

  it("offers a follow-up for a vague stored Japanese answer", () => {
    expect(
      shouldOfferFollowUp({
        transcript: "はい、そうです。",
        topic: "studyPlan",
        followUpsUsed: 0,
      }),
    ).toBe(true);
  });

  it("offers a follow-up when motivation is only anime or culture", () => {
    expect(
      shouldOfferFollowUp({
        transcript: "日本のアニメと文化が好きだからです。",
        topic: "motivationJapan",
        followUpsUsed: 0,
      }),
    ).toBe(true);
  });

  it("does not offer a follow-up for a specific motivation with a career goal", () => {
    expect(
      shouldOfferFollowUp({
        transcript:
          "将来日本でITの仕事をしたいので、日本語学校で勉強したいです。",
        topic: "motivationJapan",
        followUpsUsed: 0,
      }),
    ).toBe(false);
  });
});
