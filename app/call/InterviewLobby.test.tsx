import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InterviewLobby } from "./InterviewLobby";

describe("InterviewLobby", () => {
  it("hides blocked-mic help until the microphone is blocked", () => {
    render(
      <InterviewLobby
        cameraEnabled
        micEnabled
        cameraBlocked={false}
        micBlocked={false}
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("mic-blocked-help")).not.toBeInTheDocument();
  });

  it("shows how to unblock the microphone when it is blocked", () => {
    render(
      <InterviewLobby
        cameraEnabled
        micEnabled={false}
        cameraBlocked={false}
        micBlocked
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    const help = screen.getByTestId("mic-blocked-help");
    expect(help).toHaveTextContent("Microphone is blocked");
    expect(help).not.toHaveTextContent("[Temporary test message]");
  });

  it("says why the camera did not start instead of silently unchecking it", () => {
    render(
      <InterviewLobby
        cameraEnabled={false}
        micEnabled={false}
        cameraBlocked
        cameraErrorName="NotAllowedError"
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    const help = screen.getByTestId("camera-blocked-help");
    expect(help).toHaveTextContent("Camera is blocked");
    expect(help).toHaveTextContent(/Privacy & Security/i);
    expect(help).not.toHaveTextContent("NotAllowedError");
    expect(help).not.toHaveTextContent("Browser reported");
  });

  it("does not show the browser exception on a missing camera", () => {
    render(
      <InterviewLobby
        cameraEnabled={false}
        micEnabled={false}
        cameraBlocked
        cameraErrorName="OverconstrainedError"
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    const help = screen.getByTestId("camera-blocked-help");
    expect(help).toHaveTextContent("Camera isn't available");
    expect(help).toHaveTextContent(/continue with voice/i);
    expect(help).not.toHaveTextContent("OverconstrainedError");
    expect(help).not.toHaveTextContent("Browser reported");
    expect(help).not.toHaveTextContent("No camera found");
    expect(screen.getByRole("button", { name: "Camera" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Enter classroom" })).toBeEnabled();
  });

  it("tells the user to close the other app when the camera is busy", () => {
    render(
      <InterviewLobby
        cameraEnabled={false}
        micEnabled={false}
        cameraBlocked
        cameraErrorName="NotReadableError"
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    const help = screen.getByTestId("camera-blocked-help");
    expect(help).toHaveTextContent("Camera is busy");
    expect(help).toHaveTextContent(/another app/i);
  });

  it("hides camera help while the camera is fine", () => {
    render(
      <InterviewLobby
        cameraEnabled
        micEnabled={false}
        cameraBlocked={false}
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("camera-blocked-help")).not.toBeInTheDocument();
  });

  it("says the camera is optional so a failed camera never looks fatal", () => {
    render(
      <InterviewLobby
        cameraEnabled={false}
        micEnabled={false}
        cameraBlocked={false}
        videoRef={createRef()}
        onToggleCamera={vi.fn()}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText(/camera is optional/i)).toBeInTheDocument();
  });

  it("toggles camera from the video control click", () => {
    const onToggleCamera = vi.fn();
    render(
      <InterviewLobby
        cameraEnabled={false}
        micEnabled={false}
        cameraBlocked={false}
        videoRef={createRef()}
        onToggleCamera={onToggleCamera}
        onToggleMic={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /camera/i }));
    expect(onToggleCamera).toHaveBeenCalledTimes(1);
  });
});
