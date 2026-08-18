import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudentTile } from "./StudentTile";

const noop = () => {};

describe("StudentTile", () => {
  it("shows a camera-off placeholder (no <video>) when cameraState is 'blocked'", () => {
    render(
      <StudentTile
        cameraState="blocked"
        micOn={true}
        videoRef={createRef<HTMLVideoElement>()}
        onToggleCamera={noop}
        onToggleMic={noop}
      />,
    );

    expect(screen.getByText(/camera off/i)).toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeInTheDocument();
  });

  it("renders a live <video> element when cameraState is 'on'", () => {
    render(
      <StudentTile
        cameraState="on"
        micOn={true}
        videoRef={createRef<HTMLVideoElement>()}
        onToggleCamera={noop}
        onToggleMic={noop}
      />,
    );

    expect(document.querySelector("video")).toBeInTheDocument();
    expect(screen.queryByText(/camera off/i)).not.toBeInTheDocument();
  });

  it("calls onToggleCamera and onToggleMic when their buttons are clicked", async () => {
    const user = userEvent.setup();
    const onToggleCamera = vi.fn();
    const onToggleMic = vi.fn();

    render(
      <StudentTile
        cameraState="on"
        micOn={true}
        videoRef={createRef<HTMLVideoElement>()}
        onToggleCamera={onToggleCamera}
        onToggleMic={onToggleMic}
      />,
    );

    await user.click(screen.getByRole("button", { name: /camera/i }));
    expect(onToggleCamera).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /mic/i }));
    expect(onToggleMic).toHaveBeenCalledTimes(1);
  });
});
