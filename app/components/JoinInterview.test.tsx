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
});
