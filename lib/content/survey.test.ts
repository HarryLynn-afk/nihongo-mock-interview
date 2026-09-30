import { describe, expect, it } from "vitest";
import { buildUsefulnessView, createSessionId } from "./survey";

describe("buildUsefulnessView", () => {
  it("returns the questionnaire copy when the form is enabled", () => {
    const view = buildUsefulnessView({ formEnabled: true });
    expect(view?.copy).toBeDefined();
  });

  it("returns null when the form URL is missing", () => {
    expect(buildUsefulnessView({ formEnabled: false })).toBeNull();
  });

  it("includes the locked EN and MY survey copy", () => {
    const view = buildUsefulnessView({ formEnabled: true })!;

    expect(view.copy.consent.english).toBe(
      "Your ratings help a CSC 485 research study on AI interview feedback. Answers are anonymous and optional.",
    );
    expect(view.copy.scale.low.english).toBe("Strongly disagree");
    expect(view.copy.scale.high.english).toBe("Strongly agree");
    expect(view.copy.ratings.improveUnderstanding.english).toBe(
      "The feedback helped me understand how to improve my interview answers.",
    );
    expect(view.copy.openEnded.mostHelpful.english).toBe(
      "What was the most helpful part of NihonGo’s feedback?",
    );
    expect(view.copy.skip.english).toBe("Skip");
    expect(view.copy.skip.burmese).toBe("ကျော်မည်");
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
