import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerSubmission } from "./useQuestionFlow";
import { transcriptPassesPushbackCheck } from "@/lib/content/pushbackCheck";
import type { WordTiming } from "@/lib/content/deliveryCoaching";
import { startLiveTranscriptionSession } from "./startLiveTranscription";
import type { LiveTranscriptionSession } from "./startLiveTranscription";
import { joinJapanese } from "./transcriptionEvents";
import { concatFloat32, floatToWavBlob } from "./pcmAudio";
import { startPcmCapture, type PcmCapture } from "./pcmCapture";

export const MAX_SPEAK_ATTEMPTS = 3;
/** Auto-pause Speak after this long with no new live transcript. */
export const SPEAK_IDLE_PAUSE_MS = 10_000;

type SavedPcm = {
  samples: Float32Array;
  sampleRate: number;
};

/** Keep delivery PCM across pause/idle so Submit still has a clip. */
function appendSavedPcm(
  current: SavedPcm | null,
  next: { samples: Float32Array; sampleRate: number } | null | undefined,
): SavedPcm | null {
  if (!next || next.samples.length === 0) return current;
  if (!current) {
    return {
      samples: next.samples.slice(),
      sampleRate: next.sampleRate,
    };
  }
  return {
    samples: concatFloat32([current.samples, next.samples]),
    sampleRate: current.sampleRate,
  };
}

function appendSavedWords(
  current: WordTiming[],
  next: readonly WordTiming[] | undefined,
): WordTiming[] {
  if (!next || next.length === 0) return current;
  return current.concat(next);
}

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
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
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
  const captureRef = useRef<PcmCapture | null>(null);
  const savedPcmRef = useRef<SavedPcm | null>(null);
  const savedWordsRef = useRef<WordTiming[]>([]);
  const attemptCountRef = useRef(0);
  const liveSessionRef = useRef<LiveTranscriptionSession | null>(null);
  const submitPendingRef = useRef(false);
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
  } else if (autoSpeak && answerMode === null && !autoSpeakUsed) {
    setAutoSpeakUsed(true);
    setAnswerMode("speak");
  }

  // Capture buffers are only mutated by event handlers/effects, never while
  // drawing, so they reset after the inactive turn commits.
  useEffect(() => {
    if (active) return;
    submitPendingRef.current = false;
    transcriptBaseRef.current = "";
    attemptCountRef.current = 0;
    savedPcmRef.current = null;
    savedWordsRef.current = [];
  }, [active]);

  const listening =
    active && answerMode === "speak" && micOn && !speakPaused;
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

  useEffect(() => {
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
        const last = event.results[event.results.length - 1];
        const text = last[0].transcript;
        const result = last as { isFinal?: boolean };
        if (result.isFinal) {
          transcriptBaseRef.current += text;
          setSpokenCaption(transcriptBaseRef.current);
        } else {
          setSpokenCaption(transcriptBaseRef.current + text);
        }
        if (text) setPushbackVisible(false);
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

    function startLocalCapture() {
      void startPcmCapture().then((capture) => {
        if (cancelled) {
          capture?.stop();
          return;
        }
        captureRef.current = capture;
      });
    }

    if (liveStt) {
      void startLiveTranscriptionSession({
        onEvent: (event) => {
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
          return;
        }
        startBrowserRecognition();
        startLocalCapture();
      });
    } else {
      startBrowserRecognition();
      startLocalCapture();
    }

    return () => {
      allowRecognitionRestart = false;
      cancelled = true;
      // Snapshot before stop: pause/idle must not wipe delivery clip or words.
      const live = liveSessionRef.current;
      if (live) {
        savedPcmRef.current = appendSavedPcm(savedPcmRef.current, live.getPcm());
        savedWordsRef.current = appendSavedWords(
          savedWordsRef.current,
          live.getWords?.() ?? [],
        );
      } else if (captureRef.current) {
        savedPcmRef.current = appendSavedPcm(savedPcmRef.current, {
          samples: captureRef.current.getSamples(),
          sampleRate: captureRef.current.sampleRate,
        });
      }
      liveSessionRef.current?.stop();
      liveSessionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.stop();
      }
      captureRef.current?.stop();
      captureRef.current = null;
    };
  }, [listening, liveStt]);

  function resetSpeakSession() {
    setSpeakPaused(false);
    transcriptBaseRef.current = "";
    setSpokenCaption(null);
    // Tear down before answerMode flips to null so the listening cleanup
    // cannot re-snapshot this turn's PCM into the next attempt.
    liveSessionRef.current?.stop();
    liveSessionRef.current = null;
    captureRef.current?.stop();
    captureRef.current = null;
    savedPcmRef.current = null;
    savedWordsRef.current = [];
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

    const submitVoice = (
      transcript: string,
      clip?: Blob,
      wordTimings?: WordTiming[],
    ) => {
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
        audioClip: clip ?? new Blob(),
        pushbackCount: result.pushbackCount,
        wordTimings:
          wordTimings && wordTimings.length > 0 ? wordTimings : undefined,
      });
    };

    const live = liveSessionRef.current;
    if (live) {
      void (async () => {
        live.commit();
        await new Promise((resolve) => {
          window.setTimeout(resolve, 800);
        });
        const committed = live.getTranscript();
        const pcm = live.getPcm();
        const words = appendSavedWords(
          savedWordsRef.current,
          live.getWords?.() ?? [],
        );
        live.stop();
        liveSessionRef.current = null;
        const combined = appendSavedPcm(savedPcmRef.current, pcm);
        savedPcmRef.current = null;
        savedWordsRef.current = [];
        const clip =
          combined && combined.samples.length > 0
            ? floatToWavBlob(combined.samples, combined.sampleRate)
            : undefined;
        submitVoice(committed || spokenCaption || "", clip, words);
      })();
      return;
    }

    const capture = captureRef.current;
    const samples = capture?.getSamples();
    const liveSamples =
      capture && samples && samples.length > 0
        ? { samples, sampleRate: capture.sampleRate }
        : null;
    const combined = appendSavedPcm(savedPcmRef.current, liveSamples);
    const words = savedWordsRef.current.slice();
    savedPcmRef.current = null;
    savedWordsRef.current = [];
    capture?.stop();
    captureRef.current = null;
    const localClip =
      combined && combined.samples.length > 0
        ? floatToWavBlob(combined.samples, combined.sampleRate)
        : undefined;
    submitVoice(spokenCaption ?? "", localClip, words);
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
    onToggleSpeakPause: () => setSpeakPaused((current) => !current),
    onAnswerAgain,
    canAnswerAgain,
    onSubmitClick,
    submitPending,
    studentTurn,
    pushbackVisible,
  };
}
