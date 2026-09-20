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

  it("shows the NihonGo header and dual CTAs without a Profile card or Ready to join dialog", () => {
    render(<Home />);

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Speak real interview questions in Japanese and get a coaching report back.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try as guest" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Guest practice isn't saved.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Participant login" }),
    ).toHaveAttribute("href", "/login");
    expect(screen.getByText("Camera optional")).toHaveClass("rounded-full");
    expect(screen.getByText("Speak in Japanese")).toHaveClass("rounded-full");
    expect(screen.getByText("Coaching report")).toHaveClass("rounded-full");
    expect(screen.getByText("10–15 min")).toHaveClass("rounded-full");
    expect(
      screen.queryByText("Japanese language school interview practice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Check your camera and mic"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Aung Min Khant")).not.toBeInTheDocument();
    expect(screen.queryByText("Mandalay, Myanmar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /ready to join/i }),
    ).not.toBeInTheDocument();
  });

  it("places Try as guest and Participant login in an equal-width row on desktop", () => {
    render(<Home />);

    const guest = screen.getByRole("button", { name: "Try as guest" });
    const login = screen.getByRole("link", { name: "Participant login" });

    expect(guest.parentElement).toBe(login.parentElement);
    expect(guest.parentElement).toHaveClass("md:flex-row");
    expect(guest).toHaveClass("md:flex-1");
    expect(login).toHaveClass("md:flex-1");
  });

  it("opens the device popup on the start screen after Try as guest, with no timer", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Japanese interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("classroom-preview")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /camera/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /microphone/i })).not.toBeChecked();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /enter classroom/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /interview will start soon/i })).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("asks for the camera when the Camera box is clicked", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));
    await user.click(screen.getByRole("checkbox", { name: /camera/i }));

    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(getUserMedia).not.toHaveBeenCalledWith({ audio: true });
    expect(screen.getByRole("checkbox", { name: /camera/i })).toBeChecked();
  });

  it("Enter classroom then Skip navigates to the call screen", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));
    await user.click(screen.getByRole("button", { name: /enter classroom/i }));
    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith("/call?guest=1");
  });

  it("gates Join behind a desktop viewport and shows the open-on-a-computer message on narrow viewports, via a CSS breakpoint pair", () => {
    render(<Home />);

    const joinButton = screen.getByRole("button", { name: "Try as guest" });
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
