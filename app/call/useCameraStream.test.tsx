import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { useCameraStream } from "./useCameraStream";

describe("useCameraStream", () => {
  const getUserMedia = vi.fn();
  const enumerateDevices = vi.fn();

  beforeEach(() => {
    enumerateDevices.mockResolvedValue([]);
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia, enumerateDevices },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
    enumerateDevices.mockReset();
  });

  it("does not request the camera when startOn is false", () => {
    renderHook(() => useCameraStream({ startOn: false }));

    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("settles to 'on' once getUserMedia resolves with a stream", async () => {
    getUserMedia.mockResolvedValue({} as MediaStream);

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => {
      expect(result.current.cameraState).toBe("on");
    });
  });

  it("settles to 'on' when a listed camera opens after the default is overconstrained", async () => {
    const iphoneStream = { id: "iphone-stream" } as unknown as MediaStream;
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video === true) {
        throw new DOMException("over", "OverconstrainedError");
      }
      const video = constraints.video;
      const deviceId =
        typeof video === "object" && video && typeof video.deviceId === "object"
          ? video.deviceId
          : undefined;
      const id =
        deviceId && typeof deviceId === "object"
          ? ("ideal" in deviceId ? deviceId.ideal : deviceId.exact)
          : undefined;
      if (id === "iphone") {
        return iphoneStream;
      }
      throw new DOMException("missing", "NotFoundError");
    });
    enumerateDevices.mockResolvedValue([
      {
        kind: "videoinput",
        deviceId: "iphone",
        label: "iPhone",
        groupId: "",
        toJSON: () => ({}),
      },
    ]);

    const { result } = renderHook(() => useCameraStream());

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(3);
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
