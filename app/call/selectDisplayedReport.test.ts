import { describe, expect, it } from "vitest";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { getSampleReport } from "@/lib/content/sampleReport";
import { selectDisplayedReport } from "./selectDisplayedReport";

const almostReady: InterviewReport = {
  headline: "AlmostReady",
  stamp: "もう少し",
  total: 70,
  scores: {
    speaking: { raw: 4, weight: 20, points: 16 },
    listening: { raw: 3, weight: 15, points: 9 },
    grammarPoliteness: { raw: 3, weight: 15, points: 9 },
    motivation: { raw: 4, weight: 20, points: 16 },
    studyPlan: { raw: 4, weight: 20, points: 16 },
    consistency: { raw: 4, weight: 10, points: 8 },
  },
  gatesFired: [],
  coaching: ["Add one concrete study hour."],
  profileName: "Aung Min Khant",
  source: "n8n",
  banner: null,
};

describe("selectDisplayedReport", () => {
  it("in pitch mode replaces an AlmostReady live report with the canned sample and no banner", () => {
    const displayed = selectDisplayedReport({
      isPitchMode: true,
      live: almostReady,
    });

    expect(displayed).toEqual(getSampleReport(null));
    expect(displayed.headline).toBe("Ready");
    expect(displayed.banner).toBeNull();
  });

  it("in pitch mode keeps a live Ready report", () => {
    const live: InterviewReport = {
      ...almostReady,
      headline: "Ready",
      stamp: "準備OK",
      total: 88,
      source: "n8n",
    };

    const displayed = selectDisplayedReport({ isPitchMode: true, live });

    expect(displayed).toBe(live);
  });

  it("in pitch mode replaces a KeepPracticing live report with the canned sample and no banner", () => {
    const live: InterviewReport = {
      ...almostReady,
      headline: "KeepPracticing",
      stamp: "要練習",
      gatesFired: ["speaking"],
    };

    expect(
      selectDisplayedReport({ isPitchMode: true, live }),
    ).toEqual(getSampleReport(null));
  });

  it("without pitch mode always keeps the live report", () => {
    expect(
      selectDisplayedReport({ isPitchMode: false, live: almostReady }),
    ).toBe(almostReady);
  });
});
