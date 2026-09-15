import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PitchLanding } from "./PitchLanding";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Pitch landing (/pitch)", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("shows the NihonGo wordmark and a Pitch mode heading with a Start demo button", () => {
    render(<PitchLanding />);

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(screen.getByText("Pitch mode")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start demo/i }),
    ).toBeInTheDocument();
  });

  it("Start demo navigates straight to /call?pitch=1, with no lobby or device dialog", async () => {
    const user = userEvent.setup();
    render(<PitchLanding />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start demo/i }));

    expect(pushMock).toHaveBeenCalledWith("/call?pitch=1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("never prints exam or verdict labels anywhere on the page", () => {
    render(<PitchLanding />);

    const pageText = document.body.textContent ?? "";

    for (const term of [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/]) {
      expect(pageText).not.toMatch(term);
    }
  });

  it("never renders a sign-up, password, or email field", () => {
    render(<PitchLanding />);

    expect(document.querySelectorAll("input, form").length).toBe(0);
  });
});
