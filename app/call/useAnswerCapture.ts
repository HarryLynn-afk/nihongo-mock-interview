import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerSubmission } from "./useQuestionFlow";
import { transcriptPassesPushbackCheck } from "@/lib/content/pushbackCheck";
import { startLiveTranscriptionSession } from "./startLiveTranscription";
import type { LiveTranscriptionSession } from "./startLiveTranscription";
import { joinJapanese } from "./transcriptionEvents";

export const MAX_SPEAK_ATTEMPTS = 3;
/** Auto-pause Speak after this long with no new live transcript. */
export const SPEAK_IDLE_PAUSE_MS = 10_000;

type AnswerMode = "speak" | null;

type UseAnswerCaptureArgs = {
  active: boolean;
  micOn: boolean;
  autoSpeak?: boolean;
  liveStt?: boolean;
  onSubmit: (submission: AnswerSubmission) => void;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {
    resultIndex?: number;
    results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }>;
  }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = globalThis as typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useAnswerCapture({
  active,
  micOn,
  autoSpeak = false,
  liveStt = false,
  onSubmit,
}: UseAnswerCaptureArgs) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>(null);
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);
  const [speakPaused, setSpeakPaused] = useState(false);
  const [pushbackVisible, setPushbackVisible] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const transcriptBaseRef = useRef("");
  const liveTranscriptPrefixRef = useRef("");
  const attemptCountRef = useRef(0);
  const liveSessionRef = useRef<LiveTranscriptionSession | null>(null);
  const speakPausedRef = useRef(false);
  const submitPendingRef = useRef(false);
  const [liveFailed, setLiveFailed] = useState(false);
  const [autoSpeakUsed, setAutoSpeakUsed] = useState(false);
  const [answerAgainUsed, setAnswerAgainUsed] = useState(false);

  if (!active) {
    if (answerMode !== null) setAnswerMode(null);
    if (spokenCaption !== null) setSpokenCaption(null);
    if (speakPaused) setSpeakPaused(false);
    if (pushbackVisible) setPushbackVisible(false);
    if (submitPending) setSubmitPending(false);
    if (autoSpeakUsed) setAutoSpeakUsed(false);
    if (answerAgainUsed) setAnswerAgainUsed(false);
    if (liveFailed) setLiveFailed(false);
  } else if (autoSpeak && answerMode === null && !autoSpeakUsed) {
    setAutoSpeakUsed(true);
    setAnswerMode("speak");
  }

  // Reset transcript and attempts after the inactive turn commits.
  useEffect(() => {
    if (active) return;
    submitPendingRef.current = false;
    transcriptBaseRef.current = "";
    attemptCountRef.current = 0;
  }, [active]);

  const speakActive = active && answerMode === "speak" && micOn;
  const listening = speakActive && !speakPaused;
  const studentTurn = !active
    ? "none"
    : answerMode === "speak"
      ? "speak"
      : "idle";

  useEffect(() => {
    if (!listening) return;
    const idle = window.setTimeout(() => {
      setSpeakPaused(true);
    }, SPEAK_IDLE_PAUSE_MS);
    return () => window.clearTimeout(idle);
  }, [listening, spokenCaption]);

  // The live session lives for the whole Speak attempt; pause is forwarded,
  // so resuming never reconnects or loses audio.
  useEffect(() => {
    if (!liveStt || !speakActive || liveFailed) return;
    const prefix = transcriptBaseRef.current;
    liveTranscriptPrefixRef.current = prefix;
    let cancelled = false;
    void startLiveTranscriptionSession({
      onUnavailable: () => {
        if (cancelled) return;
        const transcript = joinJapanese(prefix, liveSessionRef.current?.getTranscript() ?? "");
        if (transcript) {
          transcriptBaseRef.current = transcript;
          setSpokenCaption(transcript);
        }
        liveSessionRef.current = null;
        setLiveFailed(true);
      },
      onEvent: (event) => {
        if (cancelled) return;
        if (event.kind === "delta") {
          setSpokenCaption(
            joinJapanese(transcriptBaseRef.current, event.delta),
          );
          if (event.delta) setPushbackVisible(false);
          return;
        }
        transcriptBaseRef.current = joinJapanese(
          transcriptBaseRef.current,
          event.transcript,
        );
        setSpokenCaption(transcriptBaseRef.current);
      },
    }).then((session) => {
      if (cancelled) {
        session?.stop();
        return;
      }
      if (session) {
        liveSessionRef.current = session;
        session.setPaused(speakPausedRef.current);
        return;
      }
      setLiveFailed(true);
    });
    return () => {
      cancelled = true;
      const live = liveSessionRef.current;
      if (live) {
        transcriptBaseRef.current = joinJapanese(prefix, live.getTranscript());
        live.stop();
      }
      liveSessionRef.current = null;
    };
  }, [liveStt, speakActive, liveFailed]);

  useEffect(() => {
    speakPausedRef.current = speakPaused;
    liveSessionRef.current?.setPaused(speakPaused);
  }, [speakPaused]);

  // Browser fallback only runs while the live session is unavailable.
  useEffect(() => {
    if (liveStt && !liveFailed) return;
    if (!listening) return;

    const Ctor = getSpeechRecognitionCtor();
    let recognition: SpeechRecognitionLike | undefined;
    let allowRecognitionRestart = true;
    let cancelled = false;
    function startBrowserRecognition() {
      if (!Ctor) return;
      recognition = new Ctor();
      recognition.lang = "ja-JP";
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (event) => {
        let interim = "";
        let changedText = "";
        const resultIndex = event.resultIndex ?? 0;
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            if (i >= resultIndex) transcriptBaseRef.current += text;
          } else interim += text;
          if (i >= resultIndex) changedText += text;
        }
        setSpokenCaption(transcriptBaseRef.current + interim);
        if (changedText) setPushbackVisible(false);
      };
      recognition.onerror = (event) => {
        const error = event.error ?? "unknown";
        // A denied mic must not be retried in a loop.
        if (error === "not-allowed" || error === "service-not-allowed") {
          allowRecognitionRestart = false;
        }
      };
      recognition.onend = () => {
        // Chrome ends continuous recognition after short silence; restart
        // while the student turn is still listening.
        if (cancelled || !allowRecognitionRestart || !recognition) return;
        try {
          recognition.start();
        } catch {
          /* InvalidStateError if already started */
        }
      };
      recognition.start();
    }

    startBrowserRecognition();

    return () => {
      allowRecognitionRestart = false;
      cancelled = true;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.stop();
      }
    };
  }, [liveStt, liveFailed, listening]);

  function resetSpeakSession() {
    setSpeakPaused(false);
    setLiveFailed(false);
    transcriptBaseRef.current = "";
    setSpokenCaption(null);
    // Tear down before answerMode flips to null so the attempt cleanup
    // cannot carry this turn's session into the next attempt.
    liveSessionRef.current?.stop();
    liveSessionRef.current = null;
  }

  function resolveAttempt(transcript: string): {
    store: boolean;
    skip: boolean;
    pushbackCount: 0 | 1 | 2;
  } {
    attemptCountRef.current += 1;
    const attempts = attemptCountRef.current;
    const passed = transcriptPassesPushbackCheck(transcript);
    if (passed) {
      return {
        store: true,
        skip: false,
        pushbackCount: (attempts - 1) as 0 | 1 | 2,
      };
    }
    if (attempts >= MAX_SPEAK_ATTEMPTS) {
      return { store: false, skip: true, pushbackCount: 2 };
    }
    return { store: false, skip: false, pushbackCount: 2 };
  }

  const onSubmitClick = useCallback(() => {
    if (answerMode !== "speak") return;
    if (submitPendingRef.current) return;
    submitPendingRef.current = true;
    setSubmitPending(true);

    const finishPending = () => {
      submitPendingRef.current = false;
      setSubmitPending(false);
    };

    const submitVoice = (transcript: string) => {
      const result = resolveAttempt(transcript);
      if (result.skip) {
        finishPending();
        resetSpeakSession();
        setAnswerMode(null);
        onSubmit({ status: "skipped" });
        return;
      }
      if (!result.store) {
        finishPending();
        setPushbackVisible(true);
        resetSpeakSession();
        setAnswerMode(null);
        return;
      }
      finishPending();
      setAnswerMode(null);
      onSubmit({
        status: "answered",
        transcript,
        pushbackCount: result.pushbackCount,
      });
    };

    const live = liveSessionRef.current;
    if (live) {
      const prefix = liveTranscriptPrefixRef.current;
      void (async () => {
        live.commit();
        await new Promise((resolve) => {
          window.setTimeout(resolve, 800);
        });
        const committed = joinJapanese(prefix, live.getTranscript());
        live.stop();
        liveSessionRef.current = null;
        submitVoice(committed || spokenCaption || "");
      })();
      return;
    }

    submitVoice(spokenCaption ?? "");
  }, [answerMode, onSubmit, spokenCaption]);

  const canAnswerAgain =
    studentTurn === "speak" && !answerAgainUsed && !submitPending;

  function onAnswerAgain() {
    if (answerMode !== "speak") return;
    if (submitPendingRef.current) return;
    if (answerAgainUsed) return;
    setAnswerAgainUsed(true);
    resetSpeakSession();
    setAnswerMode(null);
  }

  return {
    liveCaption: answerMode === "speak" ? spokenCaption : null,
    speakPaused,
    onSpeakAnswer: () => {
      resetSpeakSession();
      setAnswerMode("speak");
    },
    onToggleSpeakPause: () => {
      setSpeakPaused((current) => !current);
    },
    onAnswerAgain,
    canAnswerAgain,
    onSubmitClick,
    submitPending,
    studentTurn,
    pushbackVisible,
  };
}
