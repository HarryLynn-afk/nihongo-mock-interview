import { describe, expect, it } from "vitest";
import sample from "@/mocks/sample-report-ready.json";
import { getSampleReport, SCORING_UNAVAILABLE_BANNER } from "./sampleReport";

describe("getSampleReport", () => {
  it("uses the locked sample Ready report and the scoring-unavailable banner", () => {
    const report = getSampleReport(SCORING_UNAVAILABLE_BANNER);

    expect(report.headline).toBe("Ready");
    expect(report.stamp).toBe("準備OK");
    expect(report.total).toBe(88);
    expect(report.profileName).toBe("Aung Min Khant");
    expect(report.scores).toEqual(sample.scores);
    expect(report.gatesFired).toEqual([]);
    expect(report.critiques).toEqual(sample.critiques);
    expect(report.critiques).toHaveLength(3);
    expect(report.source).toBe("sample");
    expect(report.banner).toBe("Scoring unavailable — sample report.");
  });

  it("covers a corrective and two affirming coaching paths for the MM preview", () => {
    const report = getSampleReport(null);
    const affirming = report.critiques.filter(
      (critique) => critique.rewrite === critique.quote,
    );

    expect(affirming).toHaveLength(2);
    expect(
      report.critiques.some((critique) => critique.rewrite !== critique.quote),
    ).toBe(true);
  });
});
