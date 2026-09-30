import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { pickSessionQuestions } from "@/lib/content/questionBank";
import { questions } from "@/lib/content/questions";
import { PUSHBACK_TRY_AGAIN } from "@/lib/content/pushbackCopy";
import * as liveTranscription from "./startLiveTranscription";
import {
  getSampleReport,
} from "@/lib/content/sampleReport";
import CallPage from "./page";

vi.mock("@/lib/content/questionBank", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/questionBank")>();
  const { questions: locked } = await import("@/lib/content/questions");
  return {
    ...actual,
    pickSessionQuestions: vi.fn(() =>
      locked.map((question, index) => ({
        ...question,
        topic: actual.SESSION_TOPIC_ORDER[index],
      })),
    ),
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
    sessionStorage.clear();
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

  function hud() {
    return within(screen.getByTestId("language-hud"));
  }

  function mockLiveGradeAndSurvey(participantId?: string) {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/study/auth")) {
        return Promise.resolve(
          new Response(JSON.stringify({ signedIn: Boolean(participantId) }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
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

  it("renders both the student tile and the sensei tile on the light brand background", () => {
    render(<CallPage />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();

    const root = screen.getByTestId("call-screen");
    expect(root).toHaveClass("text-eel");
    expect(root.className).toMatch(/linear-gradient/);
    expect(root).not.toHaveClass("bg-ink");
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("confirms before ending the interview, then leaves for home", async () => {
    const user = userEvent.setup();
    render(<CallPage />);

    await user.click(screen.getByRole("button", { name: "End interview" }));

    const dialog = screen.getByRole("dialog", { name: "End interview" });
    expect(
      within(dialog).getByRole("link", { name: "End interview" }),
    ).toHaveAttribute("href", "/");

    await user.click(
      within(dialog).getByRole("button", { name: "Keep going" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "End interview" }),
    ).not.toBeInTheDocument();
  });

  it("places Tanaka-sensei and the student as separate classroom tiles", () => {
    render(<CallPage />);

    const stage = screen.getByTestId("sensei-stage");
    const student = screen.getByTestId("student-stage");

    expect(stage).toContainElement(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    );
    expect(student).toContainElement(screen.getByText("You"));
    expect(stage).not.toContainElement(student);
    expect(student).not.toHaveClass("absolute");
    expect(student).toHaveClass("md:w-44");
  });

  it("locks the classroom to the viewport so the answer dock stays on screen", () => {
    render(<CallPage />);

    expect(screen.getByTestId("call-screen")).toHaveClass(
      "h-dvh",
      "overflow-hidden",
    );
    expect(screen.getByTestId("call-stage")).toHaveClass("flex-1", "min-h-0");
    expect(screen.getByTestId("sensei-tile")).toHaveClass("absolute", "inset-0");
    expect(screen.getByTestId("classroom-row")).toContainElement(
      screen.getByTestId("student-stage"),
    );
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
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
    expect(screen.getByTestId("sensei-stage")).toContainElement(
      screen.getByTestId("language-hud"),
    );
    expect(
      screen.queryByText(questions[0].englishTranslation),
    ).not.toBeInTheDocument();
  });

  it("after sensei audio ends, the waveform switches to the student and the Question subtitle stays", async () => {
    await startStudentTurn();

    expect(screen.getByTestId("waveform")).toHaveClass("bg-feather");
    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    expect(
      hud().getByText(questions[0].englishTranslation),
    ).toBeInTheDocument();
    expect(screen.getByTestId("language-hud").textContent).not.toMatch(
      /[\u1000-\u109F]/,
    );
  });

  it("MM shows Burmese on the student-turn HUD instead of English", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: "မြန်မာ" }));

    expect(hud().getByText(questions[0].japanese)).toBeInTheDocument();
    expect(hud().getByText(questions[0].burmeseTranslation)).toBeInTheDocument();
    expect(
      hud().queryByText(questions[0].englishTranslation),
    ).not.toBeInTheDocument();
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
    expect(screen.getByTestId("answer-dock")).toHaveClass("shrink-0");
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

  it("Answer again during the first Speak returns to Speak answer", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    const redo = within(screen.getByTestId("answer-dock")).getByRole(
      "button",
      { name: /answer again/i },
    );
    expect(redo).toBeInTheDocument();
    expect(redo).toHaveTextContent(/answer again/i);
    expect(screen.queryByText("1 retry")).not.toBeInTheDocument();

    await user.click(redo);

    expect(
      screen.getByRole("button", { name: /speak answer/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /answer again/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit answer/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show Answer again after it was used on this Question", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /answer again/i }));
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    expect(
      screen.queryByRole("button", { name: /answer again/i }),
    ).not.toBeInTheDocument();
  });

  it("Answer again is available again on the next Question", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    await user.click(screen.getByRole("button", { name: /answer again/i }));
    await speakAndSubmit(user, "はじめまして");

    await waitFor(() => {
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });
    await user.click(screen.getByRole("button", { name: /speak answer/i }));

    expect(
      screen.getByRole("button", { name: /answer again/i }),
    ).toBeInTheDocument();
  });

  it("Hear again on idle replays the Question without leaving the student turn", async () => {
    const user = await startStudentTurn();

    expect(
      within(screen.getByTestId("language-hud")).getByRole("button", {
        name: /hear again/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("answer-dock")).queryByRole("button", {
        name: /hear again/i,
      }),
    ).not.toBeInTheDocument();
    expect(capturedAudioSrcs.filter((src) => src === "/question-1.mp3")).toHaveLength(
      1,
    );
    await user.click(screen.getByRole("button", { name: /hear again/i }));

    expect(capturedAudioSrcs.filter((src) => src === "/question-1.mp3")).toHaveLength(
      2,
    );
    expect(
      screen.getByRole("button", { name: /speak answer/i }),
    ).toBeInTheDocument();
    await act(async () => {
      endedHandlers.splice(0).forEach((handler) => handler());
    });
    expect(
      screen.getByRole("button", { name: /speak answer/i }),
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

  it("shows Hear again when listening is paused, not while listening", async () => {
    const user = await startStudentTurn();

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    expect(
      screen.queryByRole("button", { name: /hear again/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /pause listening/i }));
    expect(
      within(screen.getByTestId("language-hud")).getByRole("button", {
        name: /hear again/i,
      }),
    ).toBeInTheDocument();
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

  it("does not POST /api/scribe after spoken submit, then shows Q2", async () => {
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
      expect(hud().getByText(questions[1].japanese)).toBeInTheDocument();
    });

    expect(
      fetchMock.mock.calls.filter((call) =>
        String(call[0]).includes("/api/scribe"),
      ),
    ).toHaveLength(0);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/scoring|waiting|scribe/i)).not.toBeInTheDocument();
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

  it("POSTs /api/score once after Q3 when answers are ready, without showing scores", async () => {
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

  it("shows scoring unavailable when /api/score returns a null report, with no sample Ready stamp", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes("/api/score")) {
        return Promise.resolve(
          new Response(JSON.stringify({ report: null }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
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
      expect(screen.getByTestId("scoring-unavailable")).toBeInTheDocument();
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("interview-report")).not.toBeInTheDocument();
    expect(screen.queryByText("準備OK")).not.toBeInTheDocument();
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

  it("shows the honest AlmostReady live report", async () => {
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
    mockLiveGradeAndSurvey("P001");

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
      /^P-[A-HJ-NP-Z2-9]{4}$/,
    );
  });

  it("gives a Guest the 3 locked Questions and does not draw the topic bank", async () => {
    vi.mocked(pickSessionQuestions).mockClear();
    window.history.pushState({}, "", "/call?guest=1");

    render(<CallPage />);

    await waitFor(() => {
      expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    });
    expect(pickSessionQuestions).not.toHaveBeenCalled();
  });

  it("draws the topic bank for a Participant classroom", async () => {
    vi.mocked(pickSessionQuestions).mockClear();
    window.history.pushState({}, "", "/call");

    render(<CallPage />);

    await waitFor(() => {
      expect(pickSessionQuestions).toHaveBeenCalled();
    });
  });

  it("keeps Try as guest as Guest even if a leftover Participant session exists", async () => {
    mockLiveGradeAndSurvey("P001");
    window.history.pushState({}, "", "/call?guest=1");

    render(<CallPage />);

    await expect(
      screen.findByText("Participant P001", {}, { timeout: 400 }),
    ).rejects.toThrow();
    expect(
      screen.queryByText(/guest practice is not saved/i),
    ).not.toBeInTheDocument();
  });

  it("shows Participant P001 after a consented Join", async () => {
    mockLiveGradeAndSurvey("P001");
    window.history.pushState({}, "", "/call");

    render(<CallPage />);

    await waitFor(() => {
      expect(screen.getByText("Participant P001")).toBeInTheDocument();
    });
  });

  it("does not show Help the study on a Try as guest report", async () => {
    mockLiveGradeAndSurvey();
    window.history.pushState({}, "", "/call?guest=1");

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(() => {
      expect(screen.getByTestId("session-id").textContent).toMatch(
        /^G-[A-HJ-NP-Z2-9]{4}$/,
      );
    });
    expect(
      screen.queryByRole("button", { name: /help the study/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("usefulness-step")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /help the study/i }),
    ).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/survey")),
    ).toBe(false);
    expect(
      screen.getByRole("button", { name: /request the full interview/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("full-session-request")).not.toBeInTheDocument();
  });

  it("shows Help the study and no email ask to a signed-in guest", async () => {
    mockLiveGradeAndSurvey("P001");
    window.history.pushState({}, "", "/call?guest=1");

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /help the study/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /request the full interview/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("session-id").textContent).toMatch(/^G-/);
  });

  it("asks for an email from the Guest report and stays quiet after a send this visit", async () => {
    window.history.pushState({}, "", "/call?guest=1");
    const user = userEvent.setup();
    render(<CallPage />);

    await user.click(screen.getByRole("button", { name: /skip interview/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /request the full interview/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("full-session-request")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /request the full interview/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /ask for the full interview/i }),
    ).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /email/i }), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(
      screen.getByRole("dialog", { name: /you will get an email/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /request the full interview/i }),
    ).not.toBeInTheDocument();
  });

  it("skips the Guest report email ask when this visit already sent", async () => {
    sessionStorage.setItem("nihongo-full-session-request", "sent");
    window.history.pushState({}, "", "/call?guest=1");
    const user = userEvent.setup();
    render(<CallPage />);

    await user.click(screen.getByRole("button", { name: /skip interview/i }));
    await waitFor(() => {
      expect(screen.getByTestId("interview-report")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /request the full interview/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("full-session-request")).not.toBeInTheDocument();
  });

  it("tags a Guest Interview with a G- session code even if study/me still has P001", async () => {
    mockLiveGradeAndSurvey("P001");
    window.history.pushState({}, "", "/call?guest=1");

    const user = userEvent.setup();
    render(<CallPage />);
    await completeLockedInterview(user);

    await waitFor(() => {
      expect(screen.getByTestId("session-id").textContent).toMatch(
        /^G-[A-HJ-NP-Z2-9]{4}$/,
      );
    });
    expect(screen.queryByText("Participant P001")).not.toBeInTheDocument();
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
    mockLiveGradeAndSurvey("P001");

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
    mockLiveGradeAndSurvey("P001");

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
    mockLiveGradeAndSurvey("P001");

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

});
