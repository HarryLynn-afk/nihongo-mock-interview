import { describe, expect, it } from "vitest";
import { scoreReport } from "./rubric";

describe("scoreReport", () => {
  it("returns Ready/準備OK when no gates fire and total >= 75 with Motivation/StudyPlan >= 4", () => {
    const result = scoreReport({
      speaking: 5,
      listening: 4,
      grammarPoliteness: 4,
      motivation: 5,
      studyPlan: 5,
      consistency: 4,
    });

    expect(result.headline).toBe("Ready");
    expect(result.stamp).toBe("準備OK");
    expect(result.total).toBe(90);
    expect(result.gatesFired).toEqual([]);
  });

  it("does not Gate speaking from a transcript, even when the speaking integer is 2", () => {
    const result = scoreReport({
      speaking: 2,
      listening: 5,
      grammarPoliteness: 5,
      motivation: 5,
      studyPlan: 5,
      consistency: 5,
    });

    expect(result.headline).toBe("Ready");
    expect(result.total).toBe(100);
    expect(result.gatesFired).not.toContain("speaking");
  });

  it("returns KeepPracticing/要練習 when Motivation <= 2, even if Japanese is strong", () => {
    const result = scoreReport({
      speaking: 5,
      listening: 5,
      grammarPoliteness: 5,
      motivation: 2,
      studyPlan: 5,
      consistency: 5,
    });

    expect(result.headline).toBe("KeepPracticing");
    expect(result.gatesFired).toContain("motivation");
  });

  it("returns KeepPracticing/要練習 when Study plan <= 2, even if Japanese is strong", () => {
    const result = scoreReport({
      speaking: 5,
      listening: 5,
      grammarPoliteness: 5,
      motivation: 5,
      studyPlan: 2,
      consistency: 5,
    });

    expect(result.headline).toBe("KeepPracticing");
    expect(result.gatesFired).toContain("studyPlan");
  });

  it("returns AlmostReady/もう少し when no gate fires but total stays below 75", () => {
    const result = scoreReport({
      speaking: 3,
      listening: 3,
      grammarPoliteness: 3,
      motivation: 3,
      studyPlan: 3,
      consistency: 3,
    });

    expect(result.headline).toBe("AlmostReady");
    expect(result.stamp).toBe("もう少し");
    expect(result.gatesFired).toEqual([]);
  });

  it("does not let a low speaking integer block Ready", () => {
    const result = scoreReport({
      speaking: 3,
      listening: 5,
      grammarPoliteness: 5,
      motivation: 5,
      studyPlan: 5,
      consistency: 5,
    });

    expect(result.total).toBe(100);
    expect(result.headline).toBe("Ready");
  });

  it("does not Gate speaking or require speaking >= 4 when assessSpeaking is false", () => {
    const result = scoreReport(
      {
        speaking: 1,
        listening: 5,
        grammarPoliteness: 5,
        motivation: 5,
        studyPlan: 5,
        consistency: 5,
      },
      { assessSpeaking: false },
    );

    expect(result.gatesFired).toEqual([]);
    expect(result.headline).toBe("Ready");
    expect(result.total).toBe(100);
  });
});
