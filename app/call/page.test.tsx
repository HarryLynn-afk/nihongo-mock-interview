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
    window.history.replaceState({}, "", "/");
  });

  async function startStudentTurn(user = userEvent.setup()) {
    render(<CallPage />);
    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });
    return user;
  }

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

  it("on mount, warms the n8n webhook and starts playing Q1 audio without a join dialog", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/warm-n8n",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(screen.queryByRole("dialog", { name: /ready to join/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /interview will start soon/i }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
  });

  it("HUD shows the active Question's Japanese while sensei speaks", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(screen.getByTestId("language-hud")).toBeInTheDocument();
    });
    expect(screen.getByText(questions[0].japanese)).toBeInTheDocument();
    expect(
      screen.queryByText(questions[0].englishTranslation),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(questions[0].burmeseTranslation),
    ).not.toBeInTheDocument();
  });

  it("after sensei audio ends, the waveform switches to the student and the Question subtitle stays", async () => {
    await startStudentTurn();

    expect(screen.getByTestId("waveform")).toHaveClass("bg-indigo");
    expect(screen.getByText(questions[0].japanese)).toBeInTheDocument();
  });

  it("during the student turn, Speak and Type are shown and Submit is not until a choice is made", async () => {
    await startStudentTurn();

    expect(
      screen.getByRole("button", { name: /speak answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /type answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit answer/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Interview complete")).not.toBeInTheDocument();
  });

  it("Type answer reveals the answer box and Submit on the same call screen", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /type answer/i }));

    expect(screen.getByRole("textbox", { name: /answer/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /type answer/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show the answer box just because the mic is off", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /mic on/i }));

    expect(
      screen.queryByRole("textbox", { name: /answer/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /type answer/i }),
    ).toBeInTheDocument();
  });

  it("typed submit advances to the next Question's Japanese HUD caption", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /type answer/i }));
    await user.type(
      screen.getByRole("textbox", { name: /answer/i }),
      "はじめまして",
    );
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(screen.getByText(questions[1].japanese)).toBeInTheDocument();
    });
  });

  it("empty Speak answer submit does not skip the Question", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(screen.getByRole("textbox", { name: /answer/i })).toBeInTheDocument();
    expect(screen.getByText(questions[0].japanese)).toBeInTheDocument();
  });

  it("shows a live Japanese HUD caption from browser speech after Speak answer", async () => {
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

    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    await waitFor(() => {
      expect(created[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: false,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });

    expect(screen.getByText(questions[0].japanese)).toBeInTheDocument();
    expect(screen.getByText("こんにちは")).toBeInTheDocument();
  });

  it("POSTs /api/translate for a live student caption and shows English under it", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/translate")) {
        return Promise.resolve(
          new Response(JSON.stringify({ english: "Hello." }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

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

    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    await waitFor(() => {
      expect(created[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: false,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/translate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            japanese: "こんにちは",
            context: "school interview answer",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Hello.")).toBeInTheDocument();
    });
  });

  it("POSTs /api/translate after a non-pitch student answer is submitted", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/translate")) {
        return Promise.resolve(
          new Response(JSON.stringify({ english: "Nice to meet you." }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /type answer/i }));
    await user.type(
      screen.getByRole("textbox", { name: /answer/i }),
      "はじめまして",
    );
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/translate",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            japanese: "はじめまして",
            context: "school interview answer",
          }),
        }),
      );
    });
  });

  it("never shows the lobby and never calls /api/translate when ?pitch=1 is present", async () => {
    window.history.pushState({}, "", "/call?pitch=1");

    const user = userEvent.setup();
    render(<CallPage />);

    expect(screen.queryByRole("dialog", { name: /ready to join/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /interview will start soon/i }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await user.click(screen.getByRole("button", { name: /type answer/i }));
    await user.type(
      screen.getByRole("textbox", { name: /answer/i }),
      "はじめまして",
    );
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/translate")),
    ).toBe(false);
  });
});
