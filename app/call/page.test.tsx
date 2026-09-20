import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { questions } from "@/lib/content/questions";
import { PUSHBACK_TRY_AGAIN } from "@/lib/content/pushbackCopy";
import * as liveTranscription from "./startLiveTranscription";
import { pitchAnswers } from "@/lib/content/pitchAnswers";
import {
  getSampleReport,
  SCORING_UNAVAILABLE_BANNER,
} from "@/lib/content/sampleReport";
import CallPage from "./page";

vi.mock("@/lib/content/questionBank", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/questionBank")>();
  const { questions: locked } = await import("@/lib/content/questions");
  return {
    ...actual,
    pickSessionQuestions: () =>
      locked.map((question, index) => ({
        ...question,
        topic: actual.SESSION_TOPIC_ORDER[index],
      })),
  };
});

vi.mock("@/lib/content/followUpCheck", () => ({
  MAX_FOLLOW_UPS: 5,
  shouldOfferFollowUp: () => false,
}));

type FakeRecognitionInstance = {
  lang: string;
  onresult: ((event: { results: unknown[] }) => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

describe("Call screen", () => {
  const getUserMedia = vi.fn();
  const fetchMock = vi.fn();
  const audioPlay = vi.fn();
  let capturedAudioSrcs: string[] = [];
  let endedHandlers: Array<() => void> = [];
  let recognitionInstances: FakeRecognitionInstance[] = [];

  beforeEach(() => {
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream);
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
    audioPlay.mockResolvedValue(undefined);
    capturedAudioSrcs = [];
    endedHandlers = [];
    recognitionInstances = [];

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

    class DefaultFakeSpeechRecognition implements FakeRecognitionInstance {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: unknown[] }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        recognitionInstances.push(this);
      }
    }

    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("SpeechRecognition", DefaultFakeSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", DefaultFakeSpeechRecognition);
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
      expect(capturedAudioSrcs).toContain("/question-1.mp3");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });
    return user;
  }

  /** Presses Speak answer, delivers a passing transcript, then submits. */
  async function speakAndSubmit(
    user: ReturnType<typeof userEvent.setup>,
    transcript = "はい、そうです。",
  ) {
    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await waitFor(() => {
      expect(recognitionInstances.length).toBeGreaterThan(0);
    });
    act(() => {
      const spoken = Object.assign([{ transcript }], { isFinal: true });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));
  }

  async function completeLockedInterview(
    user: ReturnType<typeof userEvent.setup>,
  ) {
    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
    }
  }

  /**
   * Pitch mode auto-enters Speak for every student turn, so there is no
   * idle Speak answer button to press — just deliver a transcript and submit.
   */
  async function pitchSpeakAndSubmit(
    user: ReturnType<typeof userEvent.setup>,
    transcript: string,
  ) {
    await waitFor(() => {
      expect(recognitionInstances.length).toBeGreaterThan(0);
    });
    act(() => {
      const spoken = Object.assign([{ transcript }], { isFinal: true });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));
  }

  function hud() {
    return within(screen.getByTestId("language-hud"));
  }

  function mockLiveGradeAndSurvey(participantId?: string) {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (participantId && String(input).includes("/api/study/me")) {
        return Promise.resolve(
          new Response(JSON.stringify({ participantId }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
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
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Use です/ます all the way through.",
                    rewrite: "はじめまして。",
                    category: "speaking",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
                banner: null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      if (String(input).includes("/api/survey")) {
        return Promise.resolve(
          new Response(JSON.stringify({ enabled: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });
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

  it("places Tanaka-sensei on the classroom stage and the student as an inset", () => {
    render(<CallPage />);

    const stage = screen.getByTestId("sensei-stage");
    const inset = screen.getByTestId("student-inset");

    expect(stage).toContainElement(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    );
    expect(inset).toContainElement(screen.getByText("You"));
    expect(stage).toContainElement(inset);
  });

  it("sidebar shows Question 1 of 3 and Sensei speaking with no scores", () => {
    render(<CallPage />);

    expect(screen.getByTestId("interview-sidebar")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Sensei speaking")).toBeInTheDocument();
    expect(
      screen.queryByText(/Ready|Almost Ready|Keep Practicing|score|rubric/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("report-critiques")).not.toBeInTheDocument();
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

  it("on mount, starts playing Q1 audio without a join dialog and does not warm n8n", async () => {
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/question-1.mp3");
    });

    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/warm-n8n")),
    ).toBe(false);
    expect(screen.queryByRole("dialog", { name: /ready to join/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /interview will start soon/i }),
    ).not.toBeInTheDocument();
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

  it("during the student turn, Speak answer is shown and Submit is not until Speak is chosen", async () => {
    await startStudentTurn();

    expect(
      screen.getByRole("button", { name: /speak answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit answer/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /type answer/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Interview complete")).not.toBeInTheDocument();
  });

  it("Speak answer becomes a recording control after it is chosen", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    expect(
      screen.getByRole("button", { name: /pause listening/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("speak-answer-recording")).toBeInTheDocument();
    expect(screen.queryByTestId("speak-answer-glow")).not.toBeInTheDocument();
  });

  it("shows a Submit answer button once Speak answer is chosen", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    expect(
      screen.getByRole("button", { name: /submit answer/i }),
    ).toBeInTheDocument();
  });

  it("disables Submit answer while the live commit is pending", async () => {
    const startLive = vi
      .spyOn(liveTranscription, "startLiveTranscriptionSession")
      .mockResolvedValue({
        stop: vi.fn(),
        commit: vi.fn(),
        getTranscript: () => "こんにちは。",
        getPcm: () => ({ samples: new Float32Array(), sampleRate: 16000 }),
      });

    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await act(async () => {
      await Promise.resolve();
    });

    const submit = screen.getByRole("button", { name: /submit answer/i });
    expect(submit).toBeEnabled();
    vi.useFakeTimers();
    fireEvent.click(submit);
    expect(submit).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    vi.useRealTimers();
    startLive.mockRestore();
  });

  it("shows a Listening live transcript after Speak answer", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    expect(screen.getByTestId("live-transcript")).toHaveTextContent("Listening");
  });

  it("pauses listening when the recording control is clicked", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /pause listening/i }));

    expect(screen.getByTestId("speak-answer-paused")).toBeInTheDocument();
    expect(screen.getByTestId("live-transcript")).toHaveTextContent("Paused");
  });

  it("does not show a recording control just because the mic is off", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /mic on/i }));

    expect(
      screen.queryByTestId("speak-answer-recording"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /speak answer/i }),
    ).toBeInTheDocument();
  });

  it("a passing Speak submit advances to the next Question's Japanese HUD caption", async () => {
    const user = await startStudentTurn();

    await speakAndSubmit(user, "はじめまして");

    await waitFor(() => {
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });
  });

  it("sidebar lists each submitted turn in order and shows Question 2 of 3", async () => {
    const user = await startStudentTurn();

    await speakAndSubmit(user, "はじめまして");

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

  it("sidebar does not list a rejected Speak attempt 1", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], { isFinal: true });
      recognitionInstances[0]?.onresult?.({ results: [spoken] });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    const sidebar = within(screen.getByTestId("interview-sidebar"));
    expect(sidebar.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(sidebar.queryByText("hello")).not.toBeInTheDocument();
  });

  it("empty Speak answer submit does not skip the Question", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /speak answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /type answer/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps the Question Japanese and shows one English try-again notice above the interviewer", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    expect(
      hud().queryByText(PUSHBACK_TRY_AGAIN.english),
    ).not.toBeInTheDocument();
    expect(
      hud().queryByText(PUSHBACK_TRY_AGAIN.japanese),
    ).not.toBeInTheDocument();
    expect(
      hud().queryByText(PUSHBACK_TRY_AGAIN.burmese),
    ).not.toBeInTheDocument();

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(PUSHBACK_TRY_AGAIN.english);
    expect(banner).not.toHaveTextContent(PUSHBACK_TRY_AGAIN.japanese);
    expect(banner).not.toHaveTextContent(PUSHBACK_TRY_AGAIN.burmese);
    const stage = screen.getByTestId("call-stage");
    expect(
      banner.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });

  it("hides the try-again notice on the first live Speak caption", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(screen.getByRole("status")).toHaveTextContent(
      PUSHBACK_TRY_AGAIN.english,
    );

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await waitFor(() => {
      expect(recognitionInstances.length).toBeGreaterThan(0);
    });
    act(() => {
      const spoken = Object.assign([{ transcript: "は" }], { isFinal: false });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not keep the try-again notice after the Interview advances", async () => {
    const user = await startStudentTurn();

    await speakAndSubmit(user, "はじめまして");

    await waitFor(() => {
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByText(PUSHBACK_TRY_AGAIN.english),
    ).not.toBeInTheDocument();
  });

  it("skips the Question after 3 failing Speak attempts and still advances", async () => {
    const user = await startStudentTurn();

    // Attempt 1: empty
    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    // Attempt 2: fails the kana check
    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], { isFinal: true });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    // Attempt 3: fails again — the Question is skipped, not force-stored
    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    act(() => {
      const spoken = Object.assign([{ transcript: "still hello" }], {
        isFinal: true,
      });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });
    const sidebar = within(screen.getByTestId("interview-sidebar"));
    expect(sidebar.getByText("(No answer captured)")).toBeInTheDocument();
  });

  it("shows a live Japanese HUD caption from browser speech after Speak answer", async () => {
    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    await waitFor(() => {
      expect(recognitionInstances[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: false,
      });
      recognitionInstances[0]?.onresult?.({ results: [spoken] });
    });

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    expect(screen.getByText("こんにちは")).toBeInTheDocument();
  });

  it("shows a live student transcript without calling /api/translate", async () => {
    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    await waitFor(() => {
      expect(recognitionInstances[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: false,
      });
      recognitionInstances[0]?.onresult?.({ results: [spoken] });
    });

    expect(screen.getByTestId("live-transcript")).toHaveTextContent("こんにちは");
    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/translate")),
    ).toBe(false);
  });

  it("does not call /api/translate after a Speak answer is submitted", async () => {
    const user = await startStudentTurn();
    await speakAndSubmit(user, "はじめまして");

    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/translate")),
    ).toBe(false);
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
      expect(capturedAudioSrcs).toContain("/question-1.mp3");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    // Pitch mode auto-enters Speak; deliver a transcript and submit.
    await waitFor(() => {
      expect(recognitionInstances.length).toBeGreaterThan(0);
    });
    act(() => {
      const spoken = Object.assign([{ transcript: "はじめまして" }], {
        isFinal: true,
      });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/translate")),
    ).toBe(false);
  });

  it("with ?pitch=1 shows locked EN/MY for the current question index, not the live transcript", async () => {
    window.history.pushState({}, "", "/call?pitch=1");

    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/question-1.mp3");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    expect(hud().getByText(pitchAnswers[0].english)).toBeInTheDocument();
    expect(hud().getByText(pitchAnswers[0].burmese)).toBeInTheDocument();

    await waitFor(() => {
      expect(recognitionInstances.length).toBeGreaterThan(0);
    });
    act(() => {
      const spoken = Object.assign(
        [{ transcript: "garbage transcript that must not be matched" }],
        { isFinal: false },
      );
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });

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
      expect(capturedAudioSrcs).toContain("/question-1.mp3");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });

    await waitFor(() => {
      expect(recognitionInstances.length).toBeGreaterThan(0);
    });
    act(() => {
      const spoken = Object.assign([{ transcript: "答え1" }], { isFinal: true });
      recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
        results: [spoken],
      });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/question-2.mp3");
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
      constructor() {}
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

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
      expect(recognitionInstances[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "こんにちは" }], {
        isFinal: true,
      });
      recognitionInstances[0]?.onresult?.({ results: [spoken] });
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

  it("does not POST /api/scribe for a failing Speak attempt 1", async () => {
    const recorded = new Blob([new Uint8Array([7, 7, 7])], { type: "audio/webm" });
    class FakeMediaRecorder {
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn();
      stop = () => {
        this.ondataavailable?.({ data: recorded });
        this.onstop?.();
      };
      constructor() {}
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

    const user = await startStudentTurn();
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    await waitFor(() => {
      expect(recognitionInstances[0]?.start).toHaveBeenCalled();
    });

    act(() => {
      const spoken = Object.assign([{ transcript: "hello" }], {
        isFinal: true,
      });
      recognitionInstances[0]?.onresult?.({ results: [spoken] });
    });
    await user.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter((call) =>
        String(call[0]).includes("/api/scribe"),
      ),
    ).toHaveLength(0);
  });

  it("POSTs /api/score once after Q3 when Scribe is ready, without showing scores", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/score",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            answers: [
              { questionIndex: 0, transcript: "答え1", pushbackCount: 0 },
              { questionIndex: 1, transcript: "答え2", pushbackCount: 0 },
              { questionIndex: 2, transcript: "答え3", pushbackCount: 0 },
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
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

  it("with ?pitch=1 still shows the scoring-unavailable banner when /api/score returns the sample report", async () => {
    window.history.pushState({}, "", "/call?pitch=1");
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await pitchSpeakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(
        screen.getByText("Scoring unavailable — sample report."),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    expect(screen.getByText("準備OK")).toBeInTheDocument();
    expect(window.location.search).toBe("?pitch=1");
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
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Use です/ます all the way through.",
                    rewrite: "はじめまして。",
                    category: "speaking",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
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
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Use です/ます all the way through.",
                    rewrite: "はじめまして。",
                    category: "speaking",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("AI Interview Practice Feedback")).toBeInTheDocument();
    expect(screen.getByText("準備OK")).toBeInTheDocument();
    expect(screen.getByText("90/100")).toBeInTheDocument();
    expect(
      screen.queryByText("Scoring unavailable — sample report."),
    ).not.toBeInTheDocument();
  });

  it("with ?pitch=1 and a live AlmostReady headline shows that live report", async () => {
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
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Add one concrete study hour.",
                    rewrite: "はじめまして。",
                    category: "studyPlan",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await pitchSpeakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("もう少し")).toBeInTheDocument();
    expect(screen.getByText("73/100")).toBeInTheDocument();
    expect(screen.getByText("はじめまして")).toBeInTheDocument();
    expect(screen.queryByText("準備OK")).not.toBeInTheDocument();
    expect(screen.queryByText("90/100")).not.toBeInTheDocument();
    expect(screen.queryByText("アウン・ミン・タントです")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Scoring unavailable — sample report."),
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/call");
    expect(window.location.search).toBe("?pitch=1");
  });

  it("with ?pitch=1 and a live KeepPracticing headline shows that live report", async () => {
    window.history.pushState({}, "", "/call?pitch=1");
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: {
                headline: "KeepPracticing",
                stamp: "要練習",
                total: 70,
                scores: {
                  speaking: { raw: 4, weight: 20, points: 16 },
                  listening: { raw: 3, weight: 15, points: 9 },
                  grammarPoliteness: { raw: 3, weight: 15, points: 9 },
                  motivation: { raw: 4, weight: 20, points: 16 },
                  studyPlan: { raw: 4, weight: 20, points: 16 },
                  consistency: { raw: 4, weight: 10, points: 8 },
                },
                gatesFired: ["speaking"],
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Add one concrete study hour.",
                    rewrite: "はじめまして。",
                    category: "studyPlan",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await pitchSpeakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("要練習")).toBeInTheDocument();
    expect(screen.getByText("73/100")).toBeInTheDocument();
    expect(screen.getByText("はじめまして")).toBeInTheDocument();
    expect(screen.queryByText("準備OK")).not.toBeInTheDocument();
    expect(screen.queryByText("90/100")).not.toBeInTheDocument();
    expect(screen.queryByText("アウン・ミン・タントです")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Scoring unavailable — sample report."),
    ).not.toBeInTheDocument();
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
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Use です/ます all the way through.",
                    rewrite: "はじめまして。",
                    category: "speaking",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await pitchSpeakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("準備OK")).toBeInTheDocument();
    expect(screen.getByText("85/100")).toBeInTheDocument();
    expect(screen.queryByText("90/100")).not.toBeInTheDocument();
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
                critiques: [
                  {
                    questionIndex: 0,
                    quote: "はじめまして",
                    explanation: "Add one concrete study hour.",
                    rewrite: "はじめまして。",
                    category: "studyPlan",
                  },
                ],
                profileName: "Aung Min Khant",
                source: "grade",
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
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.getByText("もう少し")).toBeInTheDocument();
    expect(screen.getByText("73/100")).toBeInTheDocument();
    expect(screen.queryByText("90/100")).not.toBeInTheDocument();
  });

  it("shows the mic-trouble screen instead of a report when every Question was skipped", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      // Every attempt fails the kana check, so all 3 attempts are used and
      // the Question is skipped rather than force-stored.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await user.click(screen.getByRole("button", { name: /speak answer/i }));
        act(() => {
          const spoken = Object.assign([{ transcript: "hello" }], {
            isFinal: true,
          });
          recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
            results: [spoken],
          });
        });
        await user.click(screen.getByRole("button", { name: /submit answer/i }));
      }
    }

    await waitFor(() => {
      expect(screen.getByTestId("mic-trouble-screen")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("interview-report")).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some((call) => String(call[0]) === "/api/score"),
    ).toBe(false);
  });

  it("still shows the report and POSTs /api/score when at least one Question was answered", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              report: getSampleReport(null),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 202 }));
    });

    const user = userEvent.setup();
    render(<CallPage />);

    await waitFor(() => {
      expect(capturedAudioSrcs).toContain("/question-1.mp3");
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await user.click(screen.getByRole("button", { name: /speak answer/i }));
      act(() => {
        const spoken = Object.assign([{ transcript: "hello" }], {
          isFinal: true,
        });
        recognitionInstances[recognitionInstances.length - 1]?.onresult?.({
          results: [spoken],
        });
      });
      await user.click(screen.getByRole("button", { name: /submit answer/i }));
    }

    for (const question of questions.slice(1)) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await speakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("mic-trouble-screen")).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some((call) => String(call[0]) === "/api/score"),
    ).toBe(true);
  });

  it("shows Help the study and the session id after the report without opening the dialog immediately", async () => {
    mockLiveGradeAndSurvey();

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /help the study/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("usefulness-step")).not.toBeInTheDocument();
    expect(screen.getByTestId("session-id").textContent).toMatch(
      /^G-[A-HJ-NP-Z2-9]{4}$/,
    );
  });

  it("tags a Participant Interview with a P- session code, not a UUID", async () => {
    mockLiveGradeAndSurvey("P001");

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(
      () => {
        expect(screen.getByTestId("session-id").textContent).toMatch(
          /^P-[A-HJ-NP-Z2-9]{4}$/,
        );
      },
      { timeout: 2000 },
    );
  });

  it("lets Help the study open and reopen the Usefulness dialog after Close", async () => {
    mockLiveGradeAndSurvey();

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /help the study/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("dialog", { name: /help the study/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /help the study/i }));
    expect(
      screen.getByRole("dialog", { name: /help the study/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(
      screen.queryByRole("dialog", { name: /help the study/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /help the study/i }));
    expect(
      screen.getByRole("dialog", { name: /help the study/i }),
    ).toBeInTheDocument();
  });

  it("hides Help the study after Usefulness Submit", async () => {
    mockLiveGradeAndSurvey();

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /help the study/i }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /help the study/i }));

    await user.click(screen.getByRole("radio", { name: /usefulness 4/i }));
    await user.click(screen.getByRole("radio", { name: /usability 5/i }));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(
      screen.queryByRole("dialog", { name: /help the study/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /help the study/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps Help the study on a Skip interview sample report after Close", async () => {
    mockLiveGradeAndSurvey();

    const user = userEvent.setup();
    render(<CallPage />);

    await user.click(screen.getByRole("button", { name: /skip interview/i }));
    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /help the study/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("usefulness-step")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /help the study/i }));
    expect(
      screen.getByRole("dialog", { name: /help the study/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(
      screen.queryByRole("dialog", { name: /help the study/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /help the study/i }),
    ).toBeInTheDocument();
  });

  it("never shows the Usefulness step on ?pitch=1 even when the form is enabled", async () => {
    window.history.pushState({}, "", "/call?pitch=1");
    mockLiveGradeAndSurvey();

    const user = userEvent.setup();
    render(<CallPage />);

    for (const question of questions) {
      await waitFor(() => {
        expect(capturedAudioSrcs).toContain(`/question-${question.id}.mp3`);
      });
      await act(async () => {
        endedHandlers.splice(0).forEach((handler) => handler());
      });
      await pitchSpeakAndSubmit(user, `答え${question.id}`);
    }

    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });
    expect(screen.queryByTestId("usefulness-step")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /help the study/i }),
    ).not.toBeInTheDocument();
  });
});
