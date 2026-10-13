import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useMicToggle } from "./useMicToggle";

describe("useMicToggle", () => {
  const getUserMedia = vi.fn();

  function makeStream() {
    const tracks = [{ kind: "audio", stop: vi.fn() }];
    return {
      getTracks: () => tracks,
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

  it("requests microphone permission as soon as mic starts on", async () => {
    getUserMedia.mockResolvedValue(makeStream());

    renderHook(() => useMicToggle());

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it("defaults to on, and toggleMic flips it off then back on", async () => {
    getUserMedia.mockResolvedValue(makeStream());
    const { result } = renderHook(() => useMicToggle());

    expect(result.current.micOn).toBe(true);

    act(() => {
      result.current.toggleMic();
    });
    expect(result.current.micOn).toBe(false);

    getUserMedia.mockClear();
    getUserMedia.mockResolvedValue(makeStream());
    act(() => {
      result.current.toggleMic();
    });
    expect(result.current.micOn).toBe(true);

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it("turns mic off when permission is denied", async () => {
    getUserMedia.mockRejectedValue(
      new DOMException("Denied", "NotAllowedError"),
    );

    const { result } = renderHook(() => useMicToggle());

    await waitFor(() => {
      expect(result.current.micOn).toBe(false);
    });
  });

  it("reports the mic error name when permission is denied", async () => {
    getUserMedia.mockRejectedValue(
      new DOMException("Denied", "NotAllowedError"),
    );

    const { result } = renderHook(() => useMicToggle());

    await waitFor(() => {
      expect(result.current.micErrorName).toBe("NotAllowedError");
    });
  });

  it("clears the mic error once the microphone opens", async () => {
    getUserMedia.mockResolvedValue(makeStream());

    const { result } = renderHook(() => useMicToggle());

    await waitFor(() => {
      expect(result.current.micOn).toBe(true);
    });
    expect(result.current.micErrorName).toBeNull();
  });

  it("stops the mic stream when toggled off", async () => {
    const stream = makeStream();
    const tracks = stream.getTracks();
    getUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useMicToggle());

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });

    act(() => {
      result.current.toggleMic();
    });

    await waitFor(() => {
      for (const track of tracks) {
        expect(track.stop).toHaveBeenCalled();
      }
    });
  });

  it("releases a manually enabled mic when the session goes inactive", async () => {
    const stream = makeStream();
    const tracks = stream.getTracks();
    getUserMedia.mockResolvedValue(stream);

    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useMicToggle({ initialOn: false, active }),
      { initialProps: { active: true } },
    );

    act(() => {
      result.current.toggleMic();
    });
    expect(result.current.micOn).toBe(true);
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });

    rerender({ active: false });
    expect(result.current.micOn).toBe(false);
    await waitFor(() => {
      for (const track of tracks) {
        expect(track.stop).toHaveBeenCalled();
      }
    });
  });
});
