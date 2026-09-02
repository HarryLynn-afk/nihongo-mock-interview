import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLobbyDevices } from "./useLobbyDevices";

describe("useLobbyDevices", () => {
  const getUserMedia = vi.fn();

  function makeStream(kind: "video" | "audio") {
    const track = { kind, stop: vi.fn() };
    return {
      getTracks: () => [track],
      getVideoTracks: () => (kind === "video" ? [track] : []),
      getAudioTracks: () => (kind === "audio" ? [track] : []),
    } as unknown as MediaStream;
  }

  beforeEach(() => {
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
  });

  it("requests camera and mic when the lobby is active and both start enabled", async () => {
    const videoStream = makeStream("video");
    const audioStream = makeStream("audio");
    getUserMedia.mockImplementation((constraints: MediaStreamConstraints) => {
      if (constraints.video) return Promise.resolve(videoStream);
      if (constraints.audio) return Promise.resolve(audioStream);
      return Promise.reject(new Error("unexpected constraints"));
    });

    renderHook(() => useLobbyDevices({ active: true }));

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ video: true });
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it("does not request devices while the lobby is inactive", () => {
    renderHook(() => useLobbyDevices({ active: false }));
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("requests camera permission when the user checks Camera on", async () => {
    const videoStream = makeStream("video");
    getUserMedia.mockResolvedValue(videoStream);

    const { result } = renderHook(() => useLobbyDevices({ active: true }));

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    });

    getUserMedia.mockClear();
    act(() => {
      result.current.toggleCamera();
    });
    await waitFor(() => {
      expect(result.current.cameraOn).toBe(false);
    });

    getUserMedia.mockResolvedValue(videoStream);
    act(() => {
      result.current.toggleCamera();
    });

    await waitFor(() => {
      expect(result.current.cameraOn).toBe(true);
      expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    });
  });

  it("marks camera blocked and turns it off when permission is denied", async () => {
    getUserMedia.mockRejectedValue(
      new DOMException("Denied", "NotAllowedError"),
    );

    const { result } = renderHook(() => useLobbyDevices({ active: true }));

    await waitFor(() => {
      expect(result.current.cameraBlocked).toBe(true);
      expect(result.current.cameraOn).toBe(false);
    });
  });

  it("stops active streams when the lobby closes", async () => {
    const videoTrack = { kind: "video", stop: vi.fn() };
    const audioTrack = { kind: "audio", stop: vi.fn() };
    getUserMedia.mockImplementation((constraints: MediaStreamConstraints) => {
      if (constraints.video) {
        return Promise.resolve({
          getTracks: () => [videoTrack],
        } as unknown as MediaStream);
      }
      return Promise.resolve({
        getTracks: () => [audioTrack],
      } as unknown as MediaStream);
    });

    const { rerender } = renderHook(
      ({ active }) => useLobbyDevices({ active }),
      { initialProps: { active: true } },
    );

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });

    rerender({ active: false });

    await waitFor(() => {
      expect(videoTrack.stop).toHaveBeenCalled();
      expect(audioTrack.stop).toHaveBeenCalled();
    });
  });
});
