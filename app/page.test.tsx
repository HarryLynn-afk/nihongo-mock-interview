import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Home (start screen)", () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    pushMock.mockReset();
    getUserMedia.mockResolvedValue({
      getTracks: () => [],
    } as unknown as MediaStream);
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
    window.history.replaceState({}, "", "/");
  });

  it("shows the NihonGo header and Join interview without a Profile card or Ready to join dialog", () => {
    render(<Home />);

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(
      screen.getByText("Japanese language school interview practice"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Join interview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Guest practice is not saved and is not part of the study."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Participant login" }),
    ).toHaveAttribute("href", "/login");
    expect(screen.queryByText("Aung Min Khant")).not.toBeInTheDocument();
    expect(screen.queryByText("Mandalay, Myanmar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /ready to join/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the device popup on the start screen after Join interview, with no timer", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Japanese interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("classroom-preview")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /camera/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /microphone/i })).toBeChecked();
    expect(
      screen.getByRole("button", { name: /enter classroom/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /interview will start soon/i })).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("Enter classroom then Skip navigates to the call screen", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    await user.click(screen.getByRole("button", { name: /enter classroom/i }));
    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(pushMock).toHaveBeenCalledWith("/call");
  });

  it("gates Join behind a desktop viewport and shows the open-on-a-computer message on narrow viewports, via a CSS breakpoint pair", () => {
    render(<Home />);

    const joinButton = screen.getByRole("button", { name: "Join interview" });
    const joinContainer = joinButton.parentElement;
    const desktopOnlyMessage = screen.getByText(
      "Open on a computer to join the interview.",
    );

    expect(joinContainer).toHaveClass("hidden", "md:flex");
    expect(desktopOnlyMessage).toHaveClass("md:hidden");
    expect(desktopOnlyMessage).not.toHaveClass("hidden");
  });

  it("never prints exam or verdict labels anywhere on the page", () => {
    render(<Home />);

    const pageText = document.body.textContent ?? "";

    for (const term of [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/]) {
      expect(pageText).not.toMatch(term);
    }
  });

  it("never renders a sign-up, password, or email field", () => {
    render(<Home />);

    expect(document.querySelectorAll("input, form").length).toBe(0);
  });
});
