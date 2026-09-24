import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("closes the Participant device popup and stays on the account page", async () => {
    const user = userEvent.setup();
    render(<JoinInterview />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog", { name: /ready to join/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join interview" })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
  });

  it("turns off the camera preview when the device popup closes", async () => {
    const stop = vi.fn();
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ kind: "video", readyState: "live", stop }],
      getVideoTracks: () => [{ kind: "video", readyState: "live", stop }],
      getAudioTracks: () => [],
    } as unknown as MediaStream);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const user = userEvent.setup();
    render(<JoinInterview />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    await user.click(screen.getByRole("button", { name: "Camera" }));
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(stop).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    expect(screen.getByRole("button", { name: "Camera" })).toHaveAttribute("aria-pressed", "false");
    expect(pushMock).not.toHaveBeenCalled();
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

  it("releases the lobby camera before navigating to /call", async () => {
    const stop = vi.fn();
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ kind: "video", readyState: "live", stop }],
      getVideoTracks: () => [{ kind: "video", readyState: "live", stop }],
      getAudioTracks: () => [],
    } as unknown as MediaStream);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const user = userEvent.setup();
    render(<JoinInterview />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    await user.click(screen.getByRole("button", { name: /^camera$/i }));
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /enter classroom/i }));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(pushMock).toHaveBeenCalledWith("/call");
    expect(stop).toHaveBeenCalled();
  });

  it("opens /guest when a Guest clicks Try as guest, with no email dialog", async () => {
    const user = userEvent.setup();
    render(<JoinInterview guest label="Try as guest" />);

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    expect(pushMock).toHaveBeenCalledWith("/guest");
    expect(
      screen.queryByRole("dialog", { name: /how do you want to practice/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /email/i })).not.toBeInTheDocument();
  });

});
