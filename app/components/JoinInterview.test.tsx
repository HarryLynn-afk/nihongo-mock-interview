import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinInterview } from "./JoinInterview";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("JoinInterview", () => {
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
    sessionStorage.clear();
  });

  it("Participant Join stays on this page for the start popup, then Skip goes to /call", async () => {
    const user = userEvent.setup();
    render(<JoinInterview />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    await user.click(screen.getByRole("button", { name: /enter classroom/i }));

    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(pushMock).toHaveBeenCalledWith("/call");
  });

  it("asks a Guest to continue or leave an email before the lobby", async () => {
    const user = userEvent.setup();
    render(<JoinInterview guest label="Try as guest" />);

    await user.click(screen.getByRole("button", { name: /try as guest/i }));
    expect(
      screen.getByRole("dialog", { name: /how do you want to practice/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /ready to join/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue as guest/i }));
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
  });

  it("lets a Guest continue after leaving an email", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<JoinInterview guest label="Try as guest" />);

    await user.click(screen.getByRole("button", { name: /try as guest/i }));
    await user.click(screen.getByRole("button", { name: /leave an email/i }));
    await user.type(screen.getByRole("textbox", { name: /email/i }), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(
      screen.getByRole("dialog", { name: /you will get an email/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue as guest/i }));
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
  });

  it("tells a Guest they already sent when Leave an email is clicked again", async () => {
    sessionStorage.setItem("nihongo-full-session-request", "sent");
    const user = userEvent.setup();
    render(<JoinInterview guest label="Try as guest" />);

    await user.click(screen.getByRole("button", { name: /try as guest/i }));
    await user.click(screen.getByRole("button", { name: /leave an email/i }));

    expect(
      screen.getByRole("dialog", { name: /you already sent an email/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /you already sent an email/i,
    );
    expect(
      screen.getByRole("button", { name: /continue as guest/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /email/i })).not.toBeInTheDocument();
  });
});
