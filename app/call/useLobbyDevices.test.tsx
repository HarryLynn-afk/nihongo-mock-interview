import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLobbyDevices } from "./useLobbyDevices";

describe("useLobbyDevices", () => {
  const getUserMedia = vi.fn();
  const enumerateDevices = vi.fn();
  const queryMicrophone = vi.fn();

  function makeStream(kinds: Array<"video" | "audio">) {
    const tracks = kinds.map((kind) => ({
      kind,
      readyState: "live",
      stop: vi.fn(function stop(this: { readyState: string }) {
        this.readyState = "ended";
      }),
    }));
    return {
      getTracks: () => tracks,
      getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
      getAudioTracks: () => tracks.filter((t) => t.kind === "audio"),
    } as unknown as MediaStream;
  }

  beforeEach(() => {
    queryMicrophone.mockResolvedValue({ state: "prompt" });
    enumerateDevices.mockResolvedValue([]);
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video) return makeStream(["video"]);
      if (constraints.audio) return makeStream(["audio"]);
      return makeStream([]);
    });
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia, enumerateDevices },
      permissions: { query: queryMicrophone },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
    enumerateDevices.mockReset();
    queryMicrophone.mockReset();
  });

  it("does not ask for camera or microphone just because the lobby is open", () => {
    const { result } = renderHook(() => useLobbyDevices({ active: true }));

    expect(result.current.cameraOn).toBe(false);
    expect(result.current.micOn).toBe(false);
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("asks only for the camera when the user turns Camera on", async () => {
    const videoStream = makeStream(["video"]);
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video) return videoStream;
      return makeStream(["audio"]);
    });

    const { result } = renderHook(() => useLobbyDevices({ active: true }));
    const video = document.createElement("video");
    act(() => {
      result.current.videoRef(video);
    });

    act(() => {
      result.current.toggleCamera();
    });

    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(getUserMedia).not.toHaveBeenCalledWith({ audio: true });
    expect(getUserMedia).not.toHaveBeenCalledWith({
      video: true,
      audio: true,
    });
    await waitFor(() => {
      expect(video.srcObject).toBe(videoStream);
    });
  });

  it("asks only for the microphone when the user turns Microphone on", async () => {
    const { result } = renderHook(() => useLobbyDevices({ active: true }));

    act(() => {
      result.current.toggleMic();
    });

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(getUserMedia).not.toHaveBeenCalledWith({ video: true });
  });

  it("does not replace the camera preview when the microphone is turned on", async () => {
    const videoStream = makeStream(["video"]);
    const audioStream = makeStream(["audio"]);
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video) return videoStream;
      return audioStream;
    });

    const { result } = renderHook(() => useLobbyDevices({ active: true }));
    const video = document.createElement("video");
    act(() => {
      result.current.videoRef(video);
    });
    act(() => {
      result.current.toggleCamera();
    });
    await waitFor(() => {
      expect(video.srcObject).toBe(videoStream);
    });

    act(() => {
      result.current.toggleMic();
    });
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
    expect(video.srcObject).toBe(videoStream);
    expect(videoStream.getTracks()[0]?.stop).not.toHaveBeenCalled();
  });

  it("uses a listed camera when the default video request is overconstrained", async () => {
    const iphoneStream = makeStream(["video"]);
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

    const { result } = renderHook(() => useLobbyDevices({ active: true }));
    const video = document.createElement("video");
    act(() => {
      result.current.videoRef(video);
    });
    act(() => {
      result.current.toggleCamera();
    });

    await waitFor(() => {
      expect(video.srcObject).toBe(iphoneStream);
      expect(result.current.cameraOn).toBe(true);
      expect(result.current.cameraBlocked).toBe(false);
    });
  });

  it("marks camera blocked when camera permission is denied", async () => {
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        throw new DOMException("Denied", "NotAllowedError");
      }
      return makeStream(["audio"]);
    });

    const { result } = renderHook(() => useLobbyDevices({ active: true }));
    act(() => {
      result.current.toggleCamera();
    });

    await waitFor(() => {
      expect(result.current.cameraBlocked).toBe(true);
      expect(result.current.cameraOn).toBe(false);
      expect(result.current.cameraErrorName).toBe("NotAllowedError");
    });
  });

  it("reports why the camera failed when it is not a permission problem", async () => {
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        throw new DOMException("Busy", "NotReadableError");
      }
      return makeStream(["audio"]);
    });

    const { result } = renderHook(() => useLobbyDevices({ active: true }));
    act(() => {
      result.current.toggleCamera();
    });

    await waitFor(() => {
      expect(result.current.cameraErrorName).toBe("NotReadableError");
      expect(result.current.cameraOn).toBe(false);
    });
  });

  it("clears the camera failure when a later try succeeds", async () => {
    const videoStream = makeStream(["video"]);
    let videoCalls = 0;
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        videoCalls += 1;
        if (videoCalls <= 2) {
          throw new DOMException("Busy", "NotReadableError");
        }
        return videoStream;
      }
      return makeStream(["audio"]);
    });

    const { result } = renderHook(() => useLobbyDevices({ active: true }));
    act(() => {
      result.current.toggleCamera();
    });
    await waitFor(() => {
      expect(result.current.cameraErrorName).toBe("NotReadableError");
    });

    act(() => {
      result.current.toggleCamera();
    });
    await waitFor(() => {
      expect(result.current.cameraErrorName).toBe(null);
      expect(result.current.cameraOn).toBe(true);
      expect(result.current.cameraBlocked).toBe(false);
    });
  });

  it("marks mic blocked when microphone permission is denied", async () => {
    queryMicrophone.mockResolvedValue({ state: "denied" });
    getUserMedia.mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (constraints.audio) {
        throw new DOMException("Denied", "NotAllowedError");
      }
      return makeStream(["video"]);
    });
    const { result } = renderHook(() => useLobbyDevices({ active: true }));

    act(() => {
      result.current.toggleMic();
    });
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });

    await waitFor(() => {
      expect(result.current.micBlocked).toBe(true);
      expect(result.current.micOn).toBe(false);
    });
  });

  it("says the page cannot use devices when getUserMedia is missing", async () => {
    vi.stubGlobal("navigator", { permissions: { query: queryMicrophone } });
    const { result } = renderHook(() => useLobbyDevices({ active: true }));

    act(() => {
      result.current.toggleCamera();
    });
    act(() => {
      result.current.toggleMic();
    });

    await waitFor(() => {
      expect(result.current.cameraErrorName).toBe("NotSupportedError");
      expect(result.current.micErrorName).toBe("NotSupportedError");
      expect(result.current.cameraOn).toBe(false);
      expect(result.current.micOn).toBe(false);
    });
  });

  it("stops device streams when the lobby closes", async () => {
    const videoStream = makeStream(["video"]);
    getUserMedia.mockResolvedValue(videoStream);

    const { result, rerender } = renderHook(
      ({ active }) => useLobbyDevices({ active }),
      { initialProps: { active: true } },
    );

    act(() => {
      result.current.toggleCamera();
    });
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });

    rerender({ active: false });

    await waitFor(() => {
      for (const track of videoStream.getTracks()) {
        expect(track.stop).toHaveBeenCalled();
      }
    });
  });
});
