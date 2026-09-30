import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MicLevelMeter, micLevelPercent } from "./MicLevelMeter";

const stream = {} as MediaStream;

function installAudioContext(fill: number) {
  const rafCallbacks: FrameRequestCallback[] = [];
  const analyser = {
    fftSize: 32,
    getByteTimeDomainData: (data: Uint8Array) => data.fill(fill),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const context = {
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })),
    createAnalyser: vi.fn(() => analyser),
    close: vi.fn(),
  };
  vi.stubGlobal("AudioContext", function FakeAudioContext() {
    return context;
  });
  let id = 0;
  vi.stubGlobal(
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return ++id;
    },
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  return { rafCallbacks };
}

describe("MicLevelMeter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when there is no stream", () => {
    const { container } = render(<MicLevelMeter stream={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a meter once a stream is present", () => {
    render(<MicLevelMeter stream={stream} />);
    expect(screen.getByRole("meter")).toBeInTheDocument();
  });

  it("drives the meter from the live audio level", async () => {
    const { rafCallbacks } = installAudioContext(255);
    render(<MicLevelMeter stream={stream} />);

    await act(async () => {
      rafCallbacks.shift()?.(0);
    });

    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
  });

  it("reads near-silence as zero", async () => {
    const { rafCallbacks } = installAudioContext(128);
    render(<MicLevelMeter stream={stream} />);

    await act(async () => {
      rafCallbacks.shift()?.(0);
    });

    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
  });
});

describe("micLevelPercent", () => {
  it("maps digital silence to zero", () => {
    expect(micLevelPercent(0)).toBe(0);
  });

  it("keeps very low room noise at the bottom", () => {
    expect(micLevelPercent(0.001)).toBe(0);
  });

  it("puts normal speech in the middle of the bar", () => {
    expect(micLevelPercent(0.01)).toBe(33);
    expect(micLevelPercent(0.1)).toBe(67);
  });

  it("reaches full for a full-scale signal", () => {
    expect(micLevelPercent(1)).toBe(100);
  });
});
