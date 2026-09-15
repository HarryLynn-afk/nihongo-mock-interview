import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterviewReportScreen } from "./InterviewReportScreen";
import { buildReportView } from "./buildReportView";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { questions } from "@/lib/content/questions";
import { summarizeDelivery } from "@/lib/content/deliverySignals";

const report: InterviewReport = {
  headline: "Ready",
  stamp: "準備OK",
  total: 92,
  scores: {
    speaking: { raw: 5, weight: 20, points: 20 },
    listening: { raw: 4, weight: 15, points: 12 },
    grammarPoliteness: { raw: 4, weight: 15, points: 12 },
    motivation: { raw: 5, weight: 20, points: 20 },
    studyPlan: { raw: 5, weight: 20, points: 20 },
    consistency: { raw: 4, weight: 10, points: 8 },
  },
  gatesFired: [],
  critiques: [
    {
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Clear self-introduction.",
      rewrite: "はじめまして",
      category: "speaking",
    },
    {
      questionIndex: 1,
      quote: "日本で勉強したいです",
      explanation: "Add a personal future goal.",
      rewrite: "日本のIT業界で働きたいので、日本で勉強したいです。",
      category: "motivation",
    },
    {
      questionIndex: 2,
      quote: "専門学校に行きます",
      explanation: "Name a next step after school.",
      rewrite: "専門学校でウェブを勉強します。",
      category: "studyPlan",
    },
  ],
  profileName: "Aung Min Khant",
  source: "grade",
  banner: null,
};

const voiceView = buildReportView({
  report,
  answers: [
    { questionIndex: 0, status: "answered", transcript: "はじめまして" },
    { questionIndex: 1, status: "answered", transcript: "日本で勉強したいです" },
    { questionIndex: 2, status: "answered", transcript: "専門学校に行きます" },
  ],
  delivery: summarizeDelivery([
    {
      questionIndex: 0,
      signal: {
        recordingQuality: "pass",
        durationSec: 2,
        speechRateCps: 4,
        longPauseCount: 0,
        fillerCount: 0,
        observations: [
          "Answer lasted 2 seconds.",
          "Audio was clear enough for basic timing analysis.",
        ],
      },
    },
  ]),
});

const noDeliveryView = buildReportView({
  report,
  answers: [
    { questionIndex: 0, status: "answered", transcript: "はじめまして" },
    { questionIndex: 1, status: "answered", transcript: "日本で勉強したいです" },
    { questionIndex: 2, status: "answered", transcript: "専門学校に行きます" },
  ],
});

const skippedQ2View = buildReportView({
  report,
  answers: [
    { questionIndex: 0, status: "answered", transcript: "はじめまして" },
    { questionIndex: 1, status: "skipped" },
    { questionIndex: 2, status: "answered", transcript: "専門学校に行きます" },
  ],
});

describe("InterviewReportScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows AI Interview Practice Feedback, the stamp in its locked color, criterion scores as points/weight, and the /100 total", () => {
    render(<InterviewReportScreen view={voiceView} />);

    expect(screen.getByText("AI Interview Practice Feedback")).toBeInTheDocument();
    expect(screen.getByText("Interview Answer Quality")).toBeInTheDocument();
    const stamp = screen.getByText(/準備OK/);
    expect(stamp).toHaveClass("text-stamp-ready");
    expect(screen.getByText("90/100")).toBeInTheDocument();
    expect(screen.getAllByText("12/15").length).toBeGreaterThan(0);
    expect(screen.getAllByText("20/20").length).toBeGreaterThan(0);
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(
      screen.queryByText(/N5|JLPT|\bA1\b|\bPass\b|\bFail\b/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/How scoring works/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Practice next/i)).not.toBeInTheDocument();
  });

  it("does not list Listening as a scored criterion", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const bars = within(screen.getByTestId("report-score-bars"));
    expect(bars.queryByText(/^Listening$/)).not.toBeInTheDocument();
    expect(bars.getByText("Answer relevance")).toBeInTheDocument();
    expect(screen.getByText(/Listening comprehension is not scored/i)).toBeInTheDocument();
  });

  it("hides Speech Delivery Signals when no delivery data was collected", () => {
    render(<InterviewReportScreen view={noDeliveryView} />);

    expect(screen.queryByTestId("speech-delivery-signals")).not.toBeInTheDocument();
    const radar = within(screen.getByTestId("readiness-radar"));
    expect(radar.queryByText("Pronunciation")).not.toBeInTheDocument();
  });

  it("shows one selected question card with strengths, not three stacked critiques", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const critiques = within(screen.getByTestId("report-critiques"));
    expect(critiques.getAllByText("はじめまして").length).toBeGreaterThan(0);
    expect(critiques.getByText("Clear self-introduction.")).toBeInTheDocument();
    expect(critiques.getByText("Optional enhancement")).toBeInTheDocument();
    expect(
      critiques.getByText(/already meets this criterion strongly/i),
    ).toBeInTheDocument();
    expect(critiques.getByText("Useful phrase to keep")).toBeInTheDocument();
    expect(critiques.queryByText("Improve next")).not.toBeInTheDocument();
    expect(critiques.queryByText("Add a personal future goal.")).not.toBeInTheDocument();
    expect(
      critiques.queryByText(
        "သင်ပြောခဲ့သည့်စာကြောင်း − 「はじめまして」။ အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("report-coaching"),
    ).not.toBeInTheDocument();
  });

  it("reveals Burmese explanation only after the toggle", async () => {
    const user = userEvent.setup();
    render(<InterviewReportScreen view={voiceView} />);

    expect(
      screen.queryByText(
        "သင်ပြောခဲ့သည့်စာကြောင်း − 「はじめまして」။ အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /burmese explanation/i }));

    expect(
      screen.getByText(
        "သင်ပြောခဲ့သည့်စာကြောင်း − 「はじめまして」။ အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
      ),
    ).toBeInTheDocument();
  });

  it("switches the detail card from the question nav", async () => {
    const user = userEvent.setup();
    render(<InterviewReportScreen view={voiceView} />);

    await user.click(screen.getByRole("button", { name: /q2 motivation/i }));

    const critiques = within(screen.getByTestId("report-critiques"));
    expect(critiques.getByText(questions[1].japanese)).toBeInTheDocument();
    expect(critiques.getByText("Add a personal future goal.")).toBeInTheDocument();
    expect(critiques.getByText("Improve next")).toBeInTheDocument();
    expect(critiques.getByText("日本のIT業界で働きたいので、日本で勉強したいです。")).toBeInTheDocument();
  });

  it("shows a no-answer card when the selected Question was skipped", async () => {
    const user = userEvent.setup();
    render(<InterviewReportScreen view={skippedQ2View} />);

    await user.click(screen.getByRole("button", { name: /q2 motivation/i }));

    const critiques = within(screen.getByTestId("report-critiques"));
    expect(
      critiques.getByText("No answer was captured for this Question."),
    ).toBeInTheDocument();
    expect(
      critiques.getByText("Try this Question again next practice"),
    ).toBeInTheDocument();
    expect(critiques.getByText(/check your microphone/i)).toBeInTheDocument();
  });

  it("renders a radar of the assessed scores", () => {
    render(<InterviewReportScreen view={voiceView} />);

    expect(screen.getByTestId("readiness-radar")).toBeInTheDocument();
  });

  it("labels each radar axis with full untruncated category names", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const radar = within(screen.getByTestId("readiness-radar"));
    expect(radar.queryByText("Pronunciation")).not.toBeInTheDocument();
    expect(radar.getByText("Grammar")).toBeInTheDocument();
    expect(radar.getByText("Motivation")).toBeInTheDocument();
    expect(radar.getByText("Study plan")).toBeInTheDocument();
    expect(radar.getByText("Consistency")).toBeInTheDocument();
    expect(radar.getByText("Relevance")).toBeInTheDocument();
    expect(radar.queryByText("Listening")).not.toBeInTheDocument();
  });

  it("shows Speech Delivery Signals without a speaking score", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const delivery = within(screen.getByTestId("speech-delivery-signals"));
    expect(delivery.getByText("Speech Delivery Signals")).toBeInTheDocument();
    expect(delivery.getByText("Clear enough")).toBeInTheDocument();
    expect(screen.getByText(/timing signals, not a Japanese proficiency score/i)).toBeInTheDocument();
  });

  it("reveals radar, then stamp, then critiques — never all at once", async () => {
    vi.useFakeTimers();
    render(<InterviewReportScreen view={voiceView} />);

    expect(screen.getByTestId("readiness-radar")).toHaveClass("opacity-100");
    expect(screen.getByTestId("report-stamp")).toHaveClass("opacity-0");
    expect(screen.getByTestId("report-critiques")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(699);
    });
    expect(screen.getByTestId("report-stamp")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByTestId("report-stamp")).toHaveClass("opacity-100");
    expect(screen.getByTestId("report-critiques")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(screen.getByTestId("report-critiques")).toHaveClass("opacity-100");

    vi.useRealTimers();
  });

  it("shows a small session id tag on the report", () => {
    render(
      <InterviewReportScreen
        view={voiceView}
        sessionId="11111111-1111-4111-8111-111111111111"
      />,
    );

    expect(screen.getByTestId("session-id")).toHaveTextContent(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("notifies when the critique reveal finishes", async () => {
    vi.useFakeTimers();
    const onRevealComplete = vi.fn();
    render(
      <InterviewReportScreen view={voiceView} onRevealComplete={onRevealComplete} />,
    );

    expect(onRevealComplete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1399);
    });
    expect(onRevealComplete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onRevealComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
