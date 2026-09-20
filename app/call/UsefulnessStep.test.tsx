import { describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsefulnessStep } from "./UsefulnessStep";
import { buildUsefulnessView } from "@/lib/content/survey";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { getSampleReport } from "@/lib/content/sampleReport";

const view = buildUsefulnessView({
  isPitchMode: false,
  formEnabled: true,
  sessionId: "11111111-1111-4111-8111-111111111111",
})!;

const report: InterviewReport = {
  ...getSampleReport(null),
  source: "grade",
};

const answers = [
  { questionIndex: 0, pushbackCount: 0 as const, forced: false },
  { questionIndex: 1, pushbackCount: 0 as const, forced: false },
  { questionIndex: 2, pushbackCount: 0 as const, forced: false },
];

describe("UsefulnessStep", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("disables Submit until both ratings are 1-5", async () => {
    render(<UsefulnessStep view={view} report={report} answers={answers} />);

    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).toBeDisabled();

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: /usefulness 4/i }));
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /usability 5/i }));
    expect(submit).toBeEnabled();
  });

  it("POSTs skipped when Skip is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<UsefulnessStep view={view} report={report} answers={answers} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /skip/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/survey",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.skipped).toBe(true);
    expect(body.sessionId).toBe(view.sessionId);
    expect(body.source).toBe("live");
    expect(body).not.toHaveProperty("usefulness");
  });

  it("notifies the parent that Skip finished after POSTing skipped", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const onFinished = vi.fn();

    render(
      <UsefulnessStep
        view={view}
        report={report}
        answers={answers}
        onFinished={onFinished}
      />,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: /skip/i }));

    expect(fetchMock).toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("skipped");
  });

  it("POSTs both ratings and Q1-Q3 Pushback on Submit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<UsefulnessStep view={view} report={report} answers={answers} />);

    await user.click(screen.getByRole("radio", { name: /usefulness 4/i }));
    await user.click(screen.getByRole("radio", { name: /usability 5/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.skipped).toBe(false);
    expect(body.usefulness).toBe(4);
    expect(body.usability).toBe(5);
    expect(body.answers).toEqual(answers);
    expect(body.headline).toBe(report.headline);
    expect(body.total).toBe(report.total);
  });

  it("notifies the parent that Submit finished after POSTing ratings", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const onFinished = vi.fn();
    const user = userEvent.setup();

    render(
      <UsefulnessStep
        view={view}
        report={report}
        answers={answers}
        onFinished={onFinished}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /usefulness 4/i }));
    await user.click(screen.getByRole("radio", { name: /usability 5/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onFinished).toHaveBeenCalledWith("submitted");
  });

  it("is a dialog whose close dismisses without POSTing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onFinished = vi.fn();

    render(
      <UsefulnessStep
        view={view}
        report={report}
        answers={answers}
        onFinished={onFinished}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /help the study/i }),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /close/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("dismissed");
  });

  it("dismisses without POSTing when Escape is pressed", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onFinished = vi.fn();
    const user = userEvent.setup();

    render(
      <UsefulnessStep
        view={view}
        report={report}
        answers={answers}
        onFinished={onFinished}
      />,
    );
    await user.keyboard("{Escape}");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("dismissed");
  });

  it("dismisses without POSTing when the backdrop is clicked", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onFinished = vi.fn();

    render(
      <UsefulnessStep
        view={view}
        report={report}
        answers={answers}
        onFinished={onFinished}
      />,
    );
    fireEvent.click(screen.getByTestId("usefulness-backdrop"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("dismissed");
  });

  it("shows the locked consent, usefulness, usability, and Skip copy", () => {
    render(<UsefulnessStep view={view} report={report} answers={answers} />);

    expect(screen.getByText(view.copy.consent.english)).toBeInTheDocument();
    expect(screen.getByText(view.copy.consent.burmese)).toBeInTheDocument();
    expect(screen.getByText(view.copy.usefulness.english)).toBeInTheDocument();
    expect(screen.getByText(view.copy.usefulness.burmese)).toBeInTheDocument();
    expect(screen.getByText(view.copy.usability.english)).toBeInTheDocument();
    expect(screen.getByText(view.copy.usability.burmese)).toBeInTheDocument();
    expect(screen.getByText(view.copy.skip.english)).toBeInTheDocument();
    expect(screen.getByText(view.copy.skip.burmese)).toBeInTheDocument();
  });
});
