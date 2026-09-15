import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { questions } from "@/lib/content/questions";
import { InterviewSidebar } from "./InterviewSidebar";

describe("InterviewSidebar", () => {
  it("shows Question 1 of 3 and the sensei Question with no scores", () => {
    render(<InterviewSidebar phase="senseiSpeaking" answers={[]} />);

    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByText(questions[0].japanese)).toBeInTheDocument();
    expect(screen.getByText("Tanaka-sensei")).toBeInTheDocument();
    expect(screen.queryByText(/Ready|Almost Ready|Keep Practicing|score|rubric|N5|JLPT/i)).not.toBeInTheDocument();
  });

  it("labels submitted turns Tanaka-sensei and You", () => {
    render(
      <InterviewSidebar
        phase="done"
        answers={[
          { questionIndex: 0, status: "answered", transcript: "はじめまして。" },
          { questionIndex: 1, status: "answered", transcript: "日本で日本語を勉強したいです。" },
          { questionIndex: 2, status: "answered", transcript: "卒業後は大学院に進学したいです。" },
        ]}
      />,
    );

    const sidebar = within(screen.getByTestId("interview-sidebar"));
    expect(sidebar.getAllByText("Tanaka-sensei")).toHaveLength(3);
    expect(sidebar.getAllByText("You")).toHaveLength(3);
    expect(sidebar.getByText("はじめまして。")).toBeInTheDocument();
  });

  it("shows the current Turn as Sensei speaking or Student answering", () => {
    const { rerender } = render(
      <InterviewSidebar phase="senseiSpeaking" answers={[]} />,
    );

    expect(screen.getByText("Sensei speaking")).toBeInTheDocument();

    rerender(<InterviewSidebar phase="studentAnswering" answers={[]} />);

    expect(screen.getByText("Student answering")).toBeInTheDocument();
    expect(screen.queryByText("Sensei speaking")).not.toBeInTheDocument();
  });

  it("keeps the transcript rail compact and scrollable", () => {
    render(<InterviewSidebar phase="done" answers={[
      { questionIndex: 0, status: "answered", transcript: "はじめまして。" },
      { questionIndex: 1, status: "answered", transcript: "日本で日本語を勉強したいです。" },
      { questionIndex: 2, status: "answered", transcript: "卒業後は大学院に進学したいです。" },
    ]} />);

    expect(screen.getByTestId("interview-sidebar")).toHaveClass("md:max-w-56");
    expect(screen.getByRole("list")).toHaveClass("max-h-72", "overflow-y-auto");
  });

  it("shows a no-answer placeholder for a skipped turn", () => {
    render(
      <InterviewSidebar
        phase="senseiSpeaking"
        answers={[{ questionIndex: 0, status: "skipped" }]}
      />,
    );

    const sidebar = within(screen.getByTestId("interview-sidebar"));
    expect(sidebar.getByText("(No answer captured)")).toBeInTheDocument();
  });
});
