import { describe, expect, it, vi } from "vitest";
import { questions } from "./questions";
import {
  callSessionKind,
  followUpsForCallSession,
  questionsForCallSession,
} from "./callSession";

describe("call session", () => {
  it("reads Guest and Participant from the call URL", () => {
    expect(callSessionKind("?guest=1")).toBe("guest");
    expect(callSessionKind("guest=1")).toBe("guest");
    expect(callSessionKind("?pitch=1")).toBe("participant");
    expect(callSessionKind("")).toBe("participant");
    expect(callSessionKind("?guest=0")).toBe("participant");
  });

  it("gives a Guest the 3 locked Questions and does not draw the topic bank", () => {
    const pick = vi.fn(() => []);
    expect(questionsForCallSession("guest", pick)).toEqual(questions);
    expect(questionsForCallSession("guest", pick)).toHaveLength(3);
    expect(pick).not.toHaveBeenCalled();
    expect(followUpsForCallSession("guest")).toBe(false);
  });

  it("draws the topic bank and follow-ups only for a Participant", () => {
    const bank = [
      {
        id: 101,
        japanese: "bank",
        englishTranslation: "",
        burmeseTranslation: "",
      },
    ];
    const pick = vi.fn(() => bank);
    expect(questionsForCallSession("participant", pick)).toBe(bank);
    expect(pick).toHaveBeenCalledOnce();
    expect(followUpsForCallSession("participant")).toBe(true);
  });
});
