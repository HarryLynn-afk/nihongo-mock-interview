import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CallPage from "./page";

describe("Call screen", () => {
  const getUserMedia = vi.fn();
  const fetchMock = vi.fn();
  const audioPlay = vi.fn();
  let capturedAudioSrcs: string[] = [];

  beforeEach(() => {
    getUserMedia.mockResolvedValue({} as MediaStream);
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
    audioPlay.mockResolvedValue(undefined);
    capturedAudioSrcs = [];

    class FakeAudio {
      src: string;
      constructor(src: string) {
        capturedAudioSrcs.push(src);
        this.src = src;
      }
      play = audioPlay;
      addEventListener = () => {};
    }

    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Audio", FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
    fetchMock.mockReset();
    audioPlay.mockReset();
  });

  it("renders both the student tile and the sensei tile on an Ink background with Indigo accents", () => {
    render(<CallPage />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();

    const root = screen.getByTestId("call-screen");
    expect(root).toHaveClass("bg-ink");
  });

  it("still starts the interview (both tiles render, no crash) when camera permission is denied", async () => {
    getUserMedia.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));

    render(<CallPage />);

    await waitFor(() => {
      expect(screen.getByText(/camera off/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("on mount, warms the n8n webhook (fire-and-forget) and starts playing Q1 audio", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/warm-n8n",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
  });
});
