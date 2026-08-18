import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { questions } from "@/lib/content/questions";
import CallPage from "./page";

describe("Call screen", () => {
  const getUserMedia = vi.fn();
  const fetchMock = vi.fn();
  const audioPlay = vi.fn();
  let capturedAudioSrcs: string[] = [];
  let endedHandlers: Array<() => void> = [];

  beforeEach(() => {
    getUserMedia.mockResolvedValue({} as MediaStream);
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
    audioPlay.mockResolvedValue(undefined);
    capturedAudioSrcs = [];
    endedHandlers = [];

    class FakeAudio {
      src: string;
      constructor(src: string) {
        capturedAudioSrcs.push(src);
        this.src = src;
      }
      play = audioPlay;
      addEventListener = (event: string, handler: () => void) => {
        if (event === "ended") endedHandlers.push(handler);
      };
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

  it("HUD shows the active Question's Japanese while sensei speaks", () => {
    render(<CallPage />);

    expect(screen.getByTestId("language-hud")).toBeInTheDocument();
    expect(screen.getByText(questions[0].japanese)).toBeInTheDocument();
    expect(
      screen.queryByText(questions[0].englishTranslation),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(questions[0].burmeseTranslation),
    ).not.toBeInTheDocument();
  });

  it("after sensei audio ends, the waveform switches to the student and the sensei caption clears", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    expect(screen.getByTestId("waveform")).toHaveClass("bg-paper/60");

    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    expect(screen.getByTestId("waveform")).toHaveClass("bg-indigo");
    expect(screen.queryByText(questions[0].japanese)).not.toBeInTheDocument();
  });

  it("during the student turn, Submit stays available and no EN/MY captions or scores appear", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    expect(
      screen.getByRole("button", { name: /submit answer/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Interview complete")).not.toBeInTheDocument();
    expect(
      screen.queryByText(questions[0].englishTranslation),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(questions[0].burmeseTranslation),
    ).not.toBeInTheDocument();
  });

  it("Type instead is visible during the student turn while the mic is on", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    expect(
      screen.getByRole("button", { name: /type instead/i }),
    ).toBeInTheDocument();
  });

  it("Type instead reveals the answer box on the same call screen", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await user.click(screen.getByRole("button", { name: /type instead/i }));

    expect(screen.getByRole("textbox", { name: /answer/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /type instead/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the answer box by default when the mic is off during the student turn", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await user.click(screen.getByRole("button", { name: /mic on/i }));

    expect(screen.getByRole("textbox", { name: /answer/i })).toBeInTheDocument();
  });

  it("typed submit advances to the next Question's Japanese HUD caption", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await user.click(screen.getByRole("button", { name: /type instead/i }));
    await user.type(
      screen.getByRole("textbox", { name: /answer/i }),
      "はじめまして",
    );
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(screen.getByText(questions[1].japanese)).toBeInTheDocument();
    });
  });

  it("empty voice submit does not skip the Question", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(screen.getByRole("textbox", { name: /answer/i })).toBeInTheDocument();
    expect(screen.queryByText(questions[1].japanese)).not.toBeInTheDocument();
  });

  it("shows a live Japanese HUD caption from browser speech during the student turn", async () => {
    const created: Array<{
      onresult: ((event: { results: unknown[] }) => void) | null;
      start: ReturnType<typeof vi.fn>;
    }> = [];
    class FakeSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        created.push(this);
      }
    }
    vi.stubGlobal("SpeechRecognition", FakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);

    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await waitFor(() => {
      expect(created[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: false,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });

    expect(screen.getByText("こんにちは")).toBeInTheDocument();
  });
});
