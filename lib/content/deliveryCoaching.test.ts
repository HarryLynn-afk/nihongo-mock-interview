import { describe, expect, it } from "vitest";
import {
  DELIVERY_TRY_NEXT,
  formatQuestionDeliveryLabel,
  topicForDeliveryQuestion,
} from "./deliveryCoaching";

describe("deliveryCoaching", () => {
  it("maps guest locked question ids to topics", () => {
    expect(topicForDeliveryQuestion(1)).toBe("selfIntroduction");
    expect(topicForDeliveryQuestion(2)).toBe("motivationJapan");
    expect(topicForDeliveryQuestion(3)).toBe("futurePlan");
  });

  it("maps bank question ids to their topic", () => {
    expect(topicForDeliveryQuestion(101)).toBe("selfIntroduction");
  });

  it("builds Qn · Topic labels and Try-next templates", () => {
    expect(formatQuestionDeliveryLabel(1, "motivationJapan")).toBe(
      "Q2 · Motivation",
    );
    expect(DELIVERY_TRY_NEXT.motivationJapan).toMatch(/motivation/i);
  });
});
