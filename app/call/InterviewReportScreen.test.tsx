import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { InterviewReportScreen } from "./InterviewReportScreen";

const view = {
  title: "Interview Readiness",
  stamp: "準備OK" as const,
  stampColorClass: "text-stamp-ready",
  total: 92,
  banner: null,
  scores: [
    { key: "speaking" as const, label: "Speaking", raw: 5, points: 20 },
    { key: "listening" as const, label: "Listening", raw: 4, points: 12 },
    { key: "grammarPoliteness" as const, label: "Grammar & politeness", raw: 4, points: 12 },
    { key: "motivation" as const, label: "Motivation", raw: 5, points: 20 },
    { key: "studyPlan" as const, label: "Study plan", raw: 5, points: 20 },
    { key: "consistency" as const, label: "Consistency", raw: 4, points: 8 },
  ],
  coaching: ["Use です/ます all the way through."],
};

describe("InterviewReportScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Interview Readiness, the stamp in its locked color, six scores, and the /100 total", () => {
    render(<InterviewReportScreen view={view} />);

    expect(screen.getByText("Interview Readiness")).toBeInTheDocument();
    const stamp = screen.getByText("準備OK");
    expect(stamp).toHaveClass("text-stamp-ready");
    expect(screen.getByText("92/100")).toBeInTheDocument();
    expect(screen.getAllByText("Speaking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Listening").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Grammar & politeness").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Motivation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Study plan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Consistency").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/N5|JLPT|\bA1\b|\bPass\b|\bFail\b/),
    ).not.toBeInTheDocument();
  });

  it("shows coaching notes", () => {
    render(<InterviewReportScreen view={view} />);

    expect(
      screen.getByText("Use です/ます all the way through."),
    ).toBeInTheDocument();
  });

  it("renders a radar of the six scores", () => {
    render(<InterviewReportScreen view={view} />);

    expect(screen.getByTestId("readiness-radar")).toBeInTheDocument();
  });

  it("labels each radar axis with the six rubric categories", () => {
    render(<InterviewReportScreen view={view} />);

    const radar = within(screen.getByTestId("readiness-radar"));
    expect(radar.getByText("Speaking")).toBeInTheDocument();
    expect(radar.getByText("Listening")).toBeInTheDocument();
    expect(radar.getByText("Grammar & politeness")).toBeInTheDocument();
    expect(radar.getByText("Motivation")).toBeInTheDocument();
    expect(radar.getByText("Study plan")).toBeInTheDocument();
    expect(radar.getByText("Consistency")).toBeInTheDocument();
  });

  it("reveals radar, then stamp, then coaching — never all at once", async () => {
    vi.useFakeTimers();
    render(<InterviewReportScreen view={view} />);

    expect(screen.getByTestId("readiness-radar")).toHaveClass("opacity-100");
    expect(screen.getByTestId("report-stamp")).toHaveClass("opacity-0");
    expect(screen.getByTestId("report-coaching")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(699);
    });
    expect(screen.getByTestId("report-stamp")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByTestId("report-stamp")).toHaveClass("opacity-100");
    expect(screen.getByTestId("report-coaching")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(screen.getByTestId("report-coaching")).toHaveClass("opacity-100");

    vi.useRealTimers();
  });
});
