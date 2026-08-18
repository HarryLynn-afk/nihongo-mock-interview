import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { useCameraStream } from "./useCameraStream";

describe("useCameraStream", () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
  });

  it("settles to 'on' once getUserMedia resolves with a stream", async () => {
    getUserMedia.mockResolvedValue({} as MediaStream);

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => {
      expect(result.current.cameraState).toBe("on");
    });
  });

  it("settles to 'blocked' when getUserMedia rejects, without throwing", async () => {
    getUserMedia.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => {
      expect(result.current.cameraState).toBe("blocked");
    });
  });

  it("turns the camera off via toggleCamera without requesting the stream again", async () => {
    getUserMedia.mockResolvedValue({} as MediaStream);

    const { result } = renderHook(() => useCameraStream());
    await waitFor(() => expect(result.current.cameraState).toBe("on"));

    const callsBeforeToggle = getUserMedia.mock.calls.length;
    act(() => {
      result.current.toggleCamera();
    });

    expect(result.current.cameraState).toBe("off");
    expect(getUserMedia.mock.calls.length).toBe(callsBeforeToggle);
  });

  it("attaches the resolved stream to the video element via videoRef", async () => {
    const fakeStream = { id: "fake-stream" } as unknown as MediaStream;
    getUserMedia.mockResolvedValue(fakeStream);

    function TestComponent() {
      const { videoRef } = useCameraStream();
      return <video ref={videoRef} data-testid="preview" />;
    }

    render(<TestComponent />);
    const video = document.querySelector<HTMLVideoElement>(
      '[data-testid="preview"]',
    )!;

    await waitFor(() => {
      expect(video.srcObject).toBe(fakeStream);
    });
  });
});
