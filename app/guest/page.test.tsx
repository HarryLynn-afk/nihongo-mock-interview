import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuestJoin from "./page";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("/guest", () => {
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

  it("shows the join preview as the page, not a dialog over the landing", () => {
    render(<GuestJoin />);

    expect(screen.getByTestId("classroom-preview")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enter classroom/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /camera/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /microphone/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.queryByRole("dialog", { name: /ready to join/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /interview will start soon/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("uses landing paper and feather instead of a Meet-dark join screen", () => {
    const { container } = render(<GuestJoin />);

    expect(container.firstElementChild).not.toHaveClass("bg-black");
    expect(container.firstElementChild).toHaveClass("text-eel");
    expect(
      screen.getByRole("button", { name: /enter classroom/i }),
    ).toHaveClass("bg-feather");
    expect(screen.getByRole("button", { name: "ENG" })).toHaveClass(
      "bg-feather",
    );
  });

  it("asks for the camera when the Camera control is clicked", async () => {
    const user = userEvent.setup();
    render(<GuestJoin />);

    await user.click(screen.getByRole("button", { name: /camera/i }));

    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(getUserMedia).not.toHaveBeenCalledWith({ audio: true });
    expect(screen.getByRole("button", { name: /camera/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Enter classroom keeps the join preview and Skip goes to the Guest classroom", async () => {
    const user = userEvent.setup();
    render(<GuestJoin />);

    await user.click(screen.getByRole("button", { name: /enter classroom/i }));

    expect(screen.getByTestId("classroom-preview")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("start-reminder-backdrop")).not.toHaveClass(
      "bg-ink/80",
    );
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith("/call?guest=1");
  });
});
