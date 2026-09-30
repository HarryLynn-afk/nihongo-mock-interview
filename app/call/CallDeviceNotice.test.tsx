import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CallDeviceNotice } from "./CallDeviceNotice";

describe("CallDeviceNotice", () => {
  it("renders nothing when neither device failed", () => {
    const { container } = render(
      <CallDeviceNotice micErrorName={null} cameraErrorName={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows microphone help when the mic is blocked", () => {
    render(
      <CallDeviceNotice micErrorName="NotAllowedError" cameraErrorName={null} />,
    );

    expect(screen.getByTestId("call-device-notice")).toHaveTextContent(
      "Microphone is blocked",
    );
  });

  it("shows the insecure-page message when the page cannot use devices", () => {
    render(
      <CallDeviceNotice micErrorName="NotSupportedError" cameraErrorName={null} />,
    );

    expect(screen.getByTestId("call-device-notice")).toHaveTextContent(
      /camera or microphone/i,
    );
  });

  it("shows camera help when only the camera is blocked", () => {
    render(
      <CallDeviceNotice micErrorName={null} cameraErrorName="NotAllowedError" />,
    );

    expect(screen.getByTestId("call-device-notice")).toHaveTextContent(
      "Camera is blocked",
    );
  });

  it("prefers the microphone problem when both devices failed", () => {
    render(
      <CallDeviceNotice
        micErrorName="NotAllowedError"
        cameraErrorName="NotAllowedError"
      />,
    );

    const notice = screen.getByTestId("call-device-notice");
    expect(notice).toHaveTextContent("Microphone is blocked");
    expect(notice).not.toHaveTextContent("Camera is blocked");
  });
});
