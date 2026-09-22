import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useCameraStream } from "./useCameraStream";

function makeStream() {
  const tracks = [
    {
      kind: "video" as const,
      readyState: "live",
      stop: vi.fn(function stop(this: { readyState: string }) {
        this.readyState = "ended";
      }),
    },
  ];
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks,
    getAudioTracks: () => [],
  } as unknown as MediaStream;
}

describe("useCameraStream", () => {
  const getUserMedia = vi.fn();
  const enumerateDevices = vi.fn();
  const play = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    enumerateDevices.mockResolvedValue([]);
    play.mockClear();
    play.mockResolvedValue(undefined);
    HTMLVideoElement.prototype.play = play;
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

  it("stops the camera stream when toggled off", async () => {
    const stream = makeStream();
    getUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCameraStream());
    await waitFor(() => expect(result.current.cameraState).toBe("on"));

    act(() => {
      result.current.toggleCamera();
    });

    expect(result.current.cameraState).toBe("off");
    expect(stream.getTracks()[0]?.stop).toHaveBeenCalled();
  });

  it("requests a new stream and attaches it after Camera off then Camera on", async () => {
    const first = makeStream();
    const second = makeStream();
    getUserMedia
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    function TestComponent() {
      const { videoRef, toggleCamera, cameraState } = useCameraStream();
      return (
        <div>
          <span data-testid="state">{cameraState}</span>
          {cameraState === "on" ? (
            <video ref={videoRef} data-testid="preview" />
          ) : (
            <div data-testid="placeholder" />
          )}
          <button type="button" onClick={toggleCamera}>
            toggle
          </button>
        </div>
      );
    }

    const { getByRole, getByTestId } = render(<TestComponent />);
    await waitFor(() => {
      expect(getByTestId("preview").srcObject).toBe(first);
    });

    act(() => {
      getByRole("button", { name: "toggle" }).click();
    });
    expect(getByTestId("state").textContent).toBe("off");
    expect(getByTestId("placeholder")).toBeInTheDocument();

    act(() => {
      getByRole("button", { name: "toggle" }).click();
    });
    await waitFor(() => {
      expect(getByTestId("state").textContent).toBe("on");
      expect(getByTestId("preview").srcObject).toBe(second);
    });
    expect(play).toHaveBeenCalled();
  });

  it("attaches the resolved stream to the video element via videoRef", async () => {
    const fakeStream = makeStream();
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
      expect(play).toHaveBeenCalled();
    });
  });

  it("reattaches the live stream when the <video> remounts", async () => {
    const fakeStream = makeStream();
    getUserMedia.mockResolvedValue(fakeStream);

    function TestComponent() {
      const { videoRef } = useCameraStream();
      const [show, setShow] = useState(true);
      return (
        <div>
          {show ? <video ref={videoRef} data-testid="preview" /> : <div />}
          <button type="button" onClick={() => setShow((current) => !current)}>
            remount
          </button>
        </div>
      );
    }

    const { getByRole, getByTestId, queryByTestId } = render(<TestComponent />);
    await waitFor(() => {
      expect(getByTestId("preview").srcObject).toBe(fakeStream);
    });

    act(() => {
      getByRole("button", { name: "remount" }).click();
    });
    expect(queryByTestId("preview")).not.toBeInTheDocument();

    act(() => {
      getByRole("button", { name: "remount" }).click();
    });
    await waitFor(() => {
      expect(getByTestId("preview").srcObject).toBe(fakeStream);
    });
  });
});
