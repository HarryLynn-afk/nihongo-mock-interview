import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeakAnswerButton } from "./SpeakAnswerButton";

describe("SpeakAnswerButton", () => {
  it("renders an idle circular Speak answer control", () => {
    render(<SpeakAnswerButton listening={false} onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: /speak answer/i });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("speak-answer-mic")).toBeInTheDocument();
    expect(screen.queryByTestId("speak-answer-glow")).not.toBeInTheDocument();
  });

  it("shows a recording control when listening", () => {
    render(<SpeakAnswerButton listening={true} onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: /speak answer/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("speak-answer-recording")).toBeInTheDocument();
    expect(screen.queryByTestId("speak-answer-glow")).not.toBeInTheDocument();
  });

  it("starts listening when the idle control is clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<SpeakAnswerButton listening={false} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
