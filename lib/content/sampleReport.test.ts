import { describe, expect, it } from "vitest";
import sample from "@/mocks/sample-report-ready.json";
import { getSampleReport, SCORING_UNAVAILABLE_BANNER } from "./sampleReport";

describe("getSampleReport", () => {
  it("uses the locked sample Ready report and the scoring-unavailable banner", () => {
    const report = getSampleReport(SCORING_UNAVAILABLE_BANNER);

    expect(report.headline).toBe("Ready");
    expect(report.stamp).toBe("準備OK");
    expect(report.total).toBe(92);
    expect(report.profileName).toBe("Aung Min Khant");
    expect(report.scores).toEqual(sample.scores);
    expect(report.gatesFired).toEqual([]);
    expect(report.coaching).toEqual(sample.coaching);
    expect(report.source).toBe("sample");
    expect(report.banner).toBe("Scoring unavailable — sample report.");
  });
});
