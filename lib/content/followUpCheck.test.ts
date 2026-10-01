import { describe, expect, it } from "vitest";
import {
  MAX_FOLLOW_UPS,
  isSubstantialRepeat,
  shouldOfferFollowUp,
} from "./followUpCheck";

describe("MAX_FOLLOW_UPS", () => {
  it("caps a session at three follow-ups", () => {
    expect(MAX_FOLLOW_UPS).toBe(3);
  });
});

describe("isSubstantialRepeat", () => {
  it("flags the near-verbatim education/work repeat this fix removes", () => {
    expect(
      isSubstantialRepeat(
        "学校を卒業してから今まで、何をしていましたか。",
        "卒業してから今まで、何をしていましたか。",
      ),
    ).toBe(true);
  });

  it("keeps a distinct follow-up", () => {
    expect(
      isSubstantialRepeat(
        "今の状況を教えてください。学生ですか、働いていますか。",
        "今までの学校生活や仕事で、身につけたことは何ですか。",
      ),
    ).toBe(false);
  });

  it("never treats an empty question as a repeat", () => {
    expect(isSubstantialRepeat("", "はじめまして。")).toBe(false);
  });
});

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
