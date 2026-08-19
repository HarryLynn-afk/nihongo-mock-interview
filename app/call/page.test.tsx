import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { questions } from "@/lib/content/questions";
import { pitchAnswers } from "@/lib/content/pitchAnswers";
import {
  getSampleReport,
  SCORING_UNAVAILABLE_BANNER,
} from "@/lib/content/sampleReport";
import CallPage from "./page";

describe("Call screen", () => {
  const getUserMedia = vi.fn();
  const fetchMock = vi.fn();
  const audioPlay = vi.fn();
  let capturedAudioSrcs: string[] = [];
  let endedHandlers: Array<() => void> = [];

  beforeEach(() => {
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream);
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

  function hud() {
    return within(screen.getByTestId("language-hud"));
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

  it("sidebar shows Question 1 of 3 and Sensei speaking with no scores", () => {
    render(<CallPage />);

    expect(screen.getByTestId("interview-sidebar")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Sensei speaking")).toBeInTheDocument();
    expect(
      screen.queryByText(/Ready|Almost Ready|Keep Practicing|score|rubric/i),
    ).not.toBeInTheDocument();
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
    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
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
    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
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
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });
  });

  it("sidebar lists each submitted turn in order and shows Question 2 of 3", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /type answer/i }));
    await user.type(
      screen.getByRole("textbox", { name: /answer/i }),
      "はじめまして",
    );
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    const sidebar = within(screen.getByTestId("interview-sidebar"));
    await waitFor(() => {
      expect(sidebar.getByText("Question 2 of 3")).toBeInTheDocument();
    });
    const items = sidebar.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(questions[0].japanese);
    expect(items[1]).toHaveTextContent("はじめまして");
    expect(items[2]).toHaveTextContent(questions[1].japanese);
    expect(sidebar.getByText("Sensei speaking")).toBeInTheDocument();
  });

  it("empty Speak answer submit does not skip the Question", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(screen.getByRole("textbox", { name: /answer/i })).toBeInTheDocument();
    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
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

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
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

  it("with ?pitch=1 shows locked EN/MY for the current question index, not the typed transcript", async () => {
    window.history.pushState({}, "", "/call?pitch=1");

    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    expect(hud().getByText(pitchAnswers[0].english)).toBeInTheDocument();
    expect(hud().getByText(pitchAnswers[0].burmese)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /type answer/i }));
    await user.type(
      screen.getByRole("textbox", { name: /answer/i }),
      "garbage transcript that must not be matched",
    );

    expect(hud().getByText(pitchAnswers[0].english)).toBeInTheDocument();
    expect(hud().getByText(pitchAnswers[0].burmese)).toBeInTheDocument();
    expect(
      hud().queryByText("garbage transcript that must not be matched"),
    ).not.toBeInTheDocument();
  });

  it("with ?pitch=1 shows Q2 locked EN/MY after Q1, not Q1 captions", async () => {
    window.history.pushState({}, "", "/call?pitch=1");

    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=1");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });
    await user.click(screen.getByRole("button", { name: /type answer/i }));
    await user.type(screen.getByRole("textbox", { name: /answer/i }), "答え1");
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/api/tts?questionId=2");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    expect(hud().getByText(pitchAnswers[1].english)).toBeInTheDocument();
    expect(hud().getByText(pitchAnswers[1].burmese)).toBeInTheDocument();
    expect(hud().queryByText(pitchAnswers[0].english)).not.toBeInTheDocument();
  });

  it("POSTs /api/scribe after spoken submit with no waiting state, then shows Q2", async () => {
    const recorded = new Blob([new Uint8Array([7, 7, 7])], { type: "audio/webm" });
    class FakeMediaRecorder {
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn();
      stop = () => {
        this.ondataavailable?.({ data: recorded });
        this.onstop?.();
      };
      constructor(_stream: unknown) {}
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

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

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/scribe")) {
        return Promise.resolve(
          new Response(JSON.stringify({ transcript: "SCRIBE" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
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

    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    await waitFor(() => {
      expect(created[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: true,
      });
      created[0]?.onresult?.({ results: [spoken] });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/scribe",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/scoring|waiting|scribe/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });
  });

  it("POSTs /api/score once after Q3 when Scribe is ready, without showing scores", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/score",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            answers: [
              {
                questionIndex: 0,
                inputMode: "typed",
                transcript: "答え1",
              },
              {
                questionIndex: 1,
                inputMode: "typed",
                transcript: "答え2",
              },
              {
                questionIndex: 2,
                inputMode: "typed",
                transcript: "答え3",
              },
            ],
          }),
        }),
      );
    });
    expect(
      fetchMock.mock.calls.filter((call) => String(call[0]) === "/api/score"),
    ).toHaveLength(1);
    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
  });

  it("shows the scoring-unavailable banner when /api/score returns the sample report, with no spinner", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: getSampleReport(SCORING_UNAVAILABLE_BANNER),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(
        screen.getByText("Scoring unavailable — sample report."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    expect(screen.getByText("準備OK")).toBeInTheDocument();
  });

  it("does not show the scoring-unavailable banner when /api/score returns a live report", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: {
                headline: "Ready",
                stamp: "準備OK",
                total: 92,
                scores: {
                  speaking: { raw: 5, weight: 20, points: 20 },
                  listening: { raw: 4, weight: 15, points: 12 },
                  grammarPoliteness: { raw: 4, weight: 15, points: 12 },
                  motivation: { raw: 5, weight: 20, points: 20 },
                  studyPlan: { raw: 5, weight: 20, points: 20 },
                  consistency: { raw: 4, weight: 10, points: 8 },
                },
                gatesFired: [],
                coaching: ["Use です/ます all the way through."],
                profileName: "Aung Min Khant",
                source: "n8n",
                banner: null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Scoring unavailable — sample report."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("準備OK")).toBeInTheDocument();
  });

  it("shows the Interview Readiness report after Q3 when /api/score returns a report", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: {
                headline: "Ready",
                stamp: "準備OK",
                total: 92,
                scores: {
                  speaking: { raw: 5, weight: 20, points: 20 },
                  listening: { raw: 4, weight: 15, points: 12 },
                  grammarPoliteness: { raw: 4, weight: 15, points: 12 },
                  motivation: { raw: 5, weight: 20, points: 20 },
                  studyPlan: { raw: 5, weight: 20, points: 20 },
                  consistency: { raw: 4, weight: 10, points: 8 },
                },
                gatesFired: [],
                coaching: ["Use です/ます all the way through."],
                profileName: "Aung Min Khant",
                source: "n8n",
                banner: null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    expect(screen.queryByTestId("interview-report")).not.toBeInTheDocument();

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("Interview Readiness")).toBeInTheDocument();
    expect(screen.getByText("準備OK")).toBeInTheDocument();
    expect(screen.getByText("92/100")).toBeInTheDocument();
    expect(
      screen.queryByText("Scoring unavailable — sample report."),
    ).not.toBeInTheDocument();
  });

  it("with ?pitch=1 and a live AlmostReady headline swaps only the last screen to the canned sample", async () => {
    window.history.pushState({}, "", "/call?pitch=1");
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: {
                headline: "AlmostReady",
                stamp: "もう少し",
                total: 70,
                scores: {
                  speaking: { raw: 4, weight: 20, points: 16 },
                  listening: { raw: 3, weight: 15, points: 9 },
                  grammarPoliteness: { raw: 3, weight: 15, points: 9 },
                  motivation: { raw: 4, weight: 20, points: 16 },
                  studyPlan: { raw: 4, weight: 20, points: 16 },
                  consistency: { raw: 4, weight: 10, points: 8 },
                },
                gatesFired: [],
                coaching: ["Add one concrete study hour."],
                profileName: "Aung Min Khant",
                source: "n8n",
                banner: null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("準備OK")).toBeInTheDocument();
    expect(screen.getByText("92/100")).toBeInTheDocument();
    expect(screen.queryByText("もう少し")).not.toBeInTheDocument();
    expect(screen.queryByText("70/100")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Scoring unavailable — sample report."),
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/call");
    expect(window.location.search).toBe("?pitch=1");
  });

  it("with ?pitch=1 and a live Ready headline shows the live report", async () => {
    window.history.pushState({}, "", "/call?pitch=1");
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: {
                headline: "Ready",
                stamp: "準備OK",
                total: 88,
                scores: {
                  speaking: { raw: 5, weight: 20, points: 20 },
                  listening: { raw: 4, weight: 15, points: 12 },
                  grammarPoliteness: { raw: 4, weight: 15, points: 12 },
                  motivation: { raw: 5, weight: 20, points: 20 },
                  studyPlan: { raw: 4, weight: 20, points: 16 },
                  consistency: { raw: 4, weight: 10, points: 8 },
                },
                gatesFired: [],
                coaching: ["Use です/ます all the way through."],
                profileName: "Aung Min Khant",
                source: "n8n",
                banner: null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("準備OK")).toBeInTheDocument();
    expect(screen.getByText("88/100")).toBeInTheDocument();
    expect(screen.queryByText("92/100")).not.toBeInTheDocument();
  });

  it("without ?pitch=1 shows the honest AlmostReady live report", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: {
                headline: "AlmostReady",
                stamp: "もう少し",
                total: 70,
                scores: {
                  speaking: { raw: 4, weight: 20, points: 16 },
                  listening: { raw: 3, weight: 15, points: 9 },
                  grammarPoliteness: { raw: 3, weight: 15, points: 9 },
                  motivation: { raw: 4, weight: 20, points: 16 },
                  studyPlan: { raw: 4, weight: 20, points: 16 },
                  consistency: { raw: 4, weight: 10, points: 8 },
                },
                gatesFired: [],
                coaching: ["Add one concrete study hour."],
                profileName: "Aung Min Khant",
                source: "n8n",
                banner: null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/api/tts?questionId=${question.id}`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await user.click(screen.getByRole("button", { name: /type answer/i }));
      await user.type(
        screen.getByRole("textbox", { name: /answer/i }),
        `答え${question.id}`,
      );
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("もう少し")).toBeInTheDocument();
    expect(screen.getByText("70/100")).toBeInTheDocument();
    expect(screen.queryByText("92/100")).not.toBeInTheDocument();
  });
});
