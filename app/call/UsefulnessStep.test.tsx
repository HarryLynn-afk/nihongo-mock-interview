import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsefulnessStep } from "./UsefulnessStep";
import { buildUsefulnessView } from "@/lib/content/survey";

const view = buildUsefulnessView({ formEnabled: true })!;

function ratingRadios(rating: string) {
  return screen
    .getAllByRole("radio")
    .filter((el) => (el as HTMLInputElement).value === rating);
}

async function pickAllFours(user: ReturnType<typeof userEvent.setup>) {
  for (const radio of ratingRadios("4")) {
    await user.click(radio);
  }
}

describe("UsefulnessStep", () => {
  const accepted = () => vi.fn().mockResolvedValue(true);

  it("keeps answers open after failed delivery and finishes after retry", async () => {
    const onSubmit = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onFinished = vi.fn();
    const user = userEvent.setup();
    render(<UsefulnessStep view={view} onSubmit={onSubmit} onFinished={onFinished} />);

    await pickAllFours(user);
    const answer = screen.getAllByRole("textbox")[0];
    await user.type(answer, "The rewrite.");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onFinished).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(answer).toHaveValue("The rewrite.");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith("submitted"));
  });

  it("disables Submit until all 10 ratings are chosen", async () => {
    render(<UsefulnessStep view={view} onSubmit={accepted()} />);

    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).toBeDisabled();

    const user = userEvent.setup();
    const fours = ratingRadios("4");
    expect(fours).toHaveLength(10);
    for (const radio of fours.slice(0, -1)) {
      await user.click(radio);
    }
    expect(submit).toBeDisabled();

    await user.click(fours[fours.length - 1]);
    expect(submit).toBeEnabled();
  });

  it("limits written answers to the server's accepted length", () => {
    render(<UsefulnessStep view={view} onSubmit={accepted()} />);
    for (const answer of screen.getAllByRole("textbox")) {
      expect(answer).toHaveAttribute("maxLength", "1000");
    }
  });

  it("passes a skipped answer to the submitter", async () => {
    const onSubmit = accepted();
    render(<UsefulnessStep view={view} onSubmit={onSubmit} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /skip/i }));
    expect(onSubmit).toHaveBeenCalledWith({ skipped: true });
  });

  it("notifies the parent that Skip finished after POSTing skipped", async () => {
    const onSubmit = accepted();
    const onFinished = vi.fn();

    render(<UsefulnessStep view={view} onSubmit={onSubmit} onFinished={onFinished} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /skip/i }));

    expect(onSubmit).toHaveBeenCalledWith({ skipped: true });
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith("skipped"));
  });

  it("passes all 10 ratings and the open-ended answers on Submit", async () => {
    const onSubmit = accepted();
    const user = userEvent.setup();
    render(<UsefulnessStep view={view} onSubmit={onSubmit} />);

    await pickAllFours(user);
    const openEnded = screen.getAllByRole("textbox");
    await user.type(openEnded[0], "The rewrite.");
    await user.type(openEnded[2], "More questions.");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    const body = onSubmit.mock.calls[0][0];
    expect(body.skipped).toBe(false);
    expect(body.ratings).toEqual({
      improveUnderstanding: 4,
      identifyWeaknesses: 4,
      rewriteUseful: 4,
      useAgain: 4,
      easyToUse: 4,
      clearSteps: 4,
      reportClear: 4,
      completeEasily: 4,
      transcriptAccurate: 4,
      feedbackConsistent: 4,
    });
    expect(body.openEnded).toEqual({
      mostHelpful: "The rewrite.",
      unclear: "",
      improvement: "More questions.",
    });
  });

  it("notifies the parent that Submit finished after POSTing ratings", async () => {
    const onSubmit = accepted();
    const onFinished = vi.fn();
    const user = userEvent.setup();

    render(<UsefulnessStep view={view} onSubmit={onSubmit} onFinished={onFinished} />);
    await pickAllFours(user);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith("submitted"));
  });

  it("is a dialog whose close dismisses without POSTing", async () => {
    const onSubmit = accepted();
    const onFinished = vi.fn();

    render(<UsefulnessStep view={view} onSubmit={onSubmit} onFinished={onFinished} />);

    const dialog = screen.getByRole("dialog", { name: /help the study/i });
    expect(dialog).toBeInTheDocument();
    await userEvent
      .setup()
      .click(within(dialog).getByRole("button", { name: /close/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("dismissed");
  });

  it("dismisses without POSTing when Escape is pressed", async () => {
    const onSubmit = accepted();
    const onFinished = vi.fn();

    render(<UsefulnessStep view={view} onSubmit={onSubmit} onFinished={onFinished} />);
    await userEvent.setup().keyboard("{Escape}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("dismissed");
  });

  it("dismisses without POSTing when the backdrop is clicked", async () => {
    const onSubmit = accepted();
    const onFinished = vi.fn();

    render(<UsefulnessStep view={view} onSubmit={onSubmit} onFinished={onFinished} />);
    fireEvent.click(screen.getByTestId("usefulness-backdrop"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("dismissed");
  });

  it("shows the locked consent, scale, questions, and Skip copy", () => {
    render(<UsefulnessStep view={view} onSubmit={accepted()} />);

    expect(screen.getByText(view.copy.consent.english)).toBeInTheDocument();
    expect(screen.queryByText(view.copy.consent.burmese)).not.toBeInTheDocument();
    expect(screen.getByText(/Strongly disagree/)).toBeInTheDocument();
    expect(screen.getByText(view.copy.ratings.improveUnderstanding.english)).toBeInTheDocument();
    expect(screen.getByText(view.copy.openEnded.mostHelpful.english)).toBeInTheDocument();
    expect(screen.getByText(view.copy.skip.english)).toBeInTheDocument();
  });

  it("shows Burmese Help the study copy when MM is selected", () => {
    render(<UsefulnessStep view={view} locale="my" onSubmit={accepted()} />);

    expect(screen.getByText(view.copy.consent.burmese)).toBeInTheDocument();
    expect(screen.queryByText(view.copy.consent.english)).not.toBeInTheDocument();
    expect(screen.getByText(view.copy.ratings.improveUnderstanding.burmese)).toBeInTheDocument();
    expect(screen.getByText(view.copy.skip.burmese)).toBeInTheDocument();
  });
});
