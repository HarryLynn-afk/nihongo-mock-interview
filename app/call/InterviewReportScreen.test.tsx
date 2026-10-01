import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterviewReportScreen } from "./InterviewReportScreen";
import { buildReportView } from "./buildReportView";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { questions } from "@/lib/content/questions";

const report: InterviewReport = {
  total: 88,
  scores: {
    answerRelevance: { raw: 4, weight: 25, points: 25 },
    contentCompleteness: { raw: 4, weight: 25, points: 25 },
    japaneseClarity: { raw: 3, weight: 20, points: 15 },
    grammarPoliteness: { raw: 3, weight: 20, points: 15 },
    consistency: { raw: 3, weight: 10, points: 7.5 },
  },
  critiques: [
    {
      questionIndex: 0,
      quote: "はじめまして",
      explanation: "Clear self-introduction.",
      rewrite: "はじめまして",
      category: "answerRelevance",
    },
    {
      questionIndex: 1,
      quote: "日本で勉強したいです",
      explanation: "Add a personal future goal.",
      rewrite: "日本のIT業界で働きたいので、日本で勉強したいです。",
      category: "contentCompleteness",
    },
    {
      questionIndex: 2,
      quote: "専門学校に行きます",
      explanation: "Name a next step after school.",
      rewrite: "専門学校でウェブを勉強します。",
      category: "contentCompleteness",
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
});

const skippedQ2View = buildReportView({
  report,
  answers: [
    { questionIndex: 0, status: "answered", transcript: "はじめまして" },
    { questionIndex: 1, status: "skipped" },
    { questionIndex: 2, status: "answered", transcript: "専門学校に行きます" },
  ],
});

const mmView = buildReportView({
  report,
  locale: "my",
  answers: [
    { questionIndex: 0, status: "answered", transcript: "はじめまして" },
    { questionIndex: 1, status: "answered", transcript: "日本で勉強したいです" },
    { questionIndex: 2, status: "answered", transcript: "専門学校に行きます" },
  ],
});

describe("InterviewReportScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("puts Interview Answer Quality in Overview and Question chips in Review", async () => {
    const user = userEvent.setup();
    render(<InterviewReportScreen view={voiceView} />);

    const overview = screen.getByTestId("report-overview");
    const review = screen.getByTestId("report-review");

    expect(within(overview).getByText("Interview Answer Quality")).toBeInTheDocument();
    expect(within(overview).getByTestId("practice-radar")).toBeInTheDocument();
    expect(within(overview).queryByTestId("report-question-nav")).not.toBeInTheDocument();
    expect(within(overview).queryByTestId("report-critiques")).not.toBeInTheDocument();

    expect(within(review).getByTestId("report-question-nav")).toBeInTheDocument();
    expect(within(review).getByTestId("report-critiques")).toBeInTheDocument();
    expect(within(review).queryByTestId("practice-radar")).not.toBeInTheDocument();

    await user.click(
      within(review).getByRole("button", { name: /q2 motivation/i }),
    );
    expect(
      within(review).getByText("Add a personal future goal."),
    ).toBeInTheDocument();
    expect(within(overview).getByText("Interview Answer Quality")).toBeInTheDocument();
  });

  it("shows answer feedback without Speech Delivery", () => {
    render(<InterviewReportScreen view={voiceView} />);

    expect(
      within(screen.getByTestId("report-overview")).queryByTestId(
        "speech-delivery",
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("report-critiques")).queryByTestId(
        "speech-delivery",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("はじめまして").length).toBeGreaterThan(0);
  });

  it("shows the practice progress percent with no verdict wording", () => {
    render(<InterviewReportScreen view={voiceView} />);

    expect(screen.getByText("AI Interview Practice Feedback")).toBeInTheDocument();
    expect(screen.getByText("Interview Answer Quality")).toBeInTheDocument();
    expect(
      screen.queryByText(/Based on the confirmed response transcript/i),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("report-progress")).toHaveTextContent("88%");
    expect(screen.getByText("Practice progress")).toBeInTheDocument();
    expect(screen.getByTestId("interview-report")).toHaveClass("bg-white");
    expect(
      screen.queryByText(/Ready|Almost Ready|Keep Practicing|要練習|もう少し|準備OK/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/N5|JLPT|\bA1\b|\bPass\b|\bFail\b/),
    ).not.toBeInTheDocument();
  });

  it("lists the five practice criteria and never Listening", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const bars = within(screen.getByTestId("report-score-bars"));
    expect(bars.getByText("Answer relevance")).toBeInTheDocument();
    expect(bars.getByText("Content completeness")).toBeInTheDocument();
    expect(bars.getByText("Japanese clarity")).toBeInTheDocument();
    expect(bars.getByText("Grammar and politeness")).toBeInTheDocument();
    expect(bars.getByText("Cross-answer consistency")).toBeInTheDocument();
    expect(bars.queryByText(/^Listening$/)).not.toBeInTheDocument();
    expect(bars.queryByText("Motivation")).not.toBeInTheDocument();
    expect(bars.queryByText("Study plan")).not.toBeInTheDocument();
    expect(bars.getAllByText("Strong practice response").length).toBeGreaterThan(0);
    expect(bars.getAllByText("Adequate for practice").length).toBeGreaterThan(0);
  });

  it("labels each radar axis with full untruncated category names", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const radar = within(screen.getByTestId("practice-radar"));
    expect(radar.queryByText("Pronunciation")).not.toBeInTheDocument();
    expect(radar.getByText("Relevance")).toBeInTheDocument();
    expect(radar.getByText("Content")).toBeInTheDocument();
    expect(radar.getByText("Clarity")).toBeInTheDocument();
    expect(radar.getByText("Grammar")).toBeInTheDocument();
    expect(radar.getByText("Consistency")).toBeInTheDocument();
    expect(radar.queryByText("Listening")).not.toBeInTheDocument();
  });

  it("shows one selected question card with evidence, one improvement, and one rewrite", () => {
    render(<InterviewReportScreen view={voiceView} />);

    const critiques = within(screen.getByTestId("report-critiques"));
    expect(critiques.getAllByText("はじめまして").length).toBeGreaterThan(0);
    expect(
      critiques.queryByText(
        "မေးခွန်းနှင့် ကိုက်ညီသော အဖြေပေးနိုင်ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
      ),
    ).not.toBeInTheDocument();
    expect(critiques.getByText("Optional enhancement")).toBeInTheDocument();
    expect(
      critiques.getByText(
        "If you want a richer answer, cover every part Tanaka-sensei asked, not only the first clause.",
      ),
    ).toBeInTheDocument();
    expect(critiques.getByText("Useful phrase to keep")).toBeInTheDocument();
    expect(critiques.queryByText("What you did well")).not.toBeInTheDocument();
    expect(critiques.queryByText("Improve next")).not.toBeInTheDocument();
    expect(critiques.queryByText("Add a personal future goal.")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("report-coaching"),
    ).not.toBeInTheDocument();
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

  it("renders every critique string in Burmese when MM is selected", async () => {
    const user = userEvent.setup();
    render(<InterviewReportScreen view={mmView} locale="my" />);

    const critiques = within(screen.getByTestId("report-critiques"));
    expect(
      critiques.getByText(
        /မေးခွန်းနှင့် ကိုက်ညီသော အဖြေပေးနိုင်ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။/,
      ),
    ).toBeInTheDocument();
    expect(
      critiques.getByText(
        "ပိုမိုကြွယ်ဝသော အဖြေလိုချင်လျှင် Tanaka-sensei မေးသည့် အချက်တိုင်းကို ဖြေပါ၊ ပထမစာကြောင်းကိုသာ မဖြေပါနှင့်။",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("report-burmese")).not.toBeInTheDocument();
    expect(
      critiques.queryByText("Clear self-introduction."),
    ).not.toBeInTheDocument();

    await user.click(
      within(screen.getByTestId("report-question-nav")).getByRole("button", {
        name: /q2/i,
      }),
    );
    expect(
      critiques.getByText(
        "ပိုမိုအသုံးဝင်သော အချက်အလက်များ ထည့်သွင်းဖြေရန်။",
      ),
    ).toBeInTheDocument();
    expect(
      critiques.queryByText("Add a personal future goal."),
    ).not.toBeInTheDocument();
  });

  it("hides Burmese critique copy on ENG", () => {
    render(<InterviewReportScreen view={voiceView} locale="en" />);

    expect(
      screen.queryByText(
        "မေးခွန်းနှင့် ကိုက်ညီသော အဖြေပေးနိုင်ပြီး၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။",
      ),
    ).not.toBeInTheDocument();
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

  it("reveals radar, then progress, then critiques — never all at once", async () => {
    vi.useFakeTimers();
    render(<InterviewReportScreen view={voiceView} />);

    expect(screen.getByTestId("practice-radar")).toHaveClass("opacity-100");
    expect(screen.getByTestId("report-progress")).toHaveClass("opacity-0");
    expect(screen.getByTestId("report-critiques")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(699);
    });
    expect(screen.getByTestId("report-progress")).toHaveClass("opacity-0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByTestId("report-progress")).toHaveClass("opacity-100");
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
        sessionId="G-7K2M"
      />,
    );

    expect(screen.getByTestId("session-id")).toHaveTextContent(
      "G-7K2M",
    );
  });

  it("shows Help the study at the top-right of the report", async () => {
    const onHelpStudy = vi.fn();
    render(
      <InterviewReportScreen view={voiceView} onHelpStudy={onHelpStudy} />,
    );

    const help = screen.getByRole("button", { name: /help the study/i });
    expect(help.className).toMatch(/absolute/);
    expect(help.className).toMatch(/right-4/);
    expect(help.className).toMatch(/top-4/);
    await userEvent.setup().click(help);
    expect(onHelpStudy).toHaveBeenCalledTimes(1);
  });

  it("shows Request the full interview when that action is provided", async () => {
    const onRequestFullSession = vi.fn();
    render(
      <InterviewReportScreen
        view={voiceView}
        onRequestFullSession={onRequestFullSession}
      />,
    );

    const request = screen.getByRole("button", {
      name: /request the full interview/i,
    });
    expect(request.className).toMatch(/absolute/);
    await userEvent.setup().click(request);
    expect(onRequestFullSession).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /help the study/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show Help the study when onHelpStudy is omitted", () => {
    render(<InterviewReportScreen view={voiceView} />);

    expect(
      screen.queryByRole("button", { name: /help the study/i }),
    ).not.toBeInTheDocument();
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

  it("offers Practice again and Back to home when onPracticeAgain is provided", async () => {
    const onPracticeAgain = vi.fn();
    render(
      <InterviewReportScreen view={voiceView} onPracticeAgain={onPracticeAgain} />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /practice again/i }));

    expect(onPracticeAgain).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toHaveAttribute("href", "/");
  });

  it("sends Back to home to the given destination", () => {
    render(
      <InterviewReportScreen
        view={voiceView}
        onPracticeAgain={vi.fn()}
        homeHref="/join?from=rsu-k7m2"
      />,
    );

    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toHaveAttribute("href", "/join?from=rsu-k7m2");
  });

  it("hides the practice actions when onPracticeAgain is omitted", () => {
    render(<InterviewReportScreen view={voiceView} />);

    expect(
      screen.queryByRole("button", { name: /practice again/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /back to home/i }),
    ).not.toBeInTheDocument();
  });
});
