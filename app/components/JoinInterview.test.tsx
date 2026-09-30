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

  it("asks for consent before opening Participant device setup", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ participantId: "P001" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<JoinInterview consentRequired />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));

    expect(screen.getByRole("dialog", { name: "Study consent" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /ready to join/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Agree and continue" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/study/consent", { method: "POST" });
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

  it("cancels the start countdown back to the lobby without leaving", async () => {
    const user = userEvent.setup();
    render(<JoinInterview />);

    await user.click(screen.getByRole("button", { name: "Join interview" }));
    await user.click(screen.getByRole("button", { name: /enter classroom/i }));

    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: /interview will start soon/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /ready to join/i }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("opens the device popup inline for a Guest, then Skip goes to /call?guest=1", async () => {
    const user = userEvent.setup();
    render(<JoinInterview guest label="Try as guest" />);

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    expect(
      screen.getByRole("dialog", { name: /ready to join/i }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: /how do you want to practice/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /email/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /enter classroom/i }));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(pushMock).toHaveBeenCalledWith("/call?guest=1");
  });

});
