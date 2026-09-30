import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterviewStartReminder } from "./InterviewStartReminder";

describe("InterviewStartReminder", () => {
  it("is a popup over the lobby, not a full replacement page", () => {
    render(<InterviewStartReminder secondsLeft={15} onSkip={() => {}} onCancel={() => {}} />);

    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("start-reminder-backdrop")).not.toHaveClass(
      "bg-ink/80",
    );
    expect(screen.getByRole("dialog")).toHaveClass("bg-white");
    expect(screen.getByRole("button", { name: /^skip$/i })).toHaveClass(
      "bg-feather",
    );
    expect(screen.getByRole("dialog")).toHaveClass("rounded-2xl");
    expect(screen.getByText("15s")).toBeInTheDocument();
  });

  it("Skip fires without waiting for 0", async () => {
    const onSkip = vi.fn();
    const user = userEvent.setup();
    render(<InterviewStartReminder secondsLeft={12} onSkip={onSkip} onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("disables Skip once the timer has reached 0", () => {
    render(<InterviewStartReminder secondsLeft={0} onSkip={() => {}} onCancel={() => {}} />);

    expect(screen.getByRole("button", { name: /^skip$/i })).toBeDisabled();
  });
});
