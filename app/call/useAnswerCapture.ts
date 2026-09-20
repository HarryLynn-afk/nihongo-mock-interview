import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerSubmission } from "./useQuestionFlow";
import { transcriptPassesPushbackCheck } from "@/lib/content/pushbackCheck";
import { startLiveTranscriptionSession } from "./startLiveTranscription";
import type { LiveTranscriptionSession } from "./startLiveTranscription";
import { joinJapanese } from "./transcriptionEvents";
import { floatToWavBlob } from "./pcmAudio";

export const MAX_SPEAK_ATTEMPTS = 3;

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

type MediaRecorderLike = {
  start: () => void;
  stop: () => void;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
};

type MediaRecorderCtor = new (stream: MediaStream) => MediaRecorderLike;
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getMediaRecorderCtor(): MediaRecorderCtor | undefined {
  const w = globalThis as typeof globalThis & {
    MediaRecorder?: MediaRecorderCtor;
  };
  return w.MediaRecorder;
}

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
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptBaseRef = useRef("");
  const recorderRef = useRef<MediaRecorderLike | null>(null);
  const autoSpeakUsedRef = useRef(false);
  const attemptCountRef = useRef(0);
  const liveSessionRef = useRef<LiveTranscriptionSession | null>(null);

  if (!active) {
    autoSpeakUsedRef.current = false;
    if (answerMode !== null) setAnswerMode(null);
    if (spokenCaption !== null) setSpokenCaption(null);
    if (speakPaused) setSpeakPaused(false);
    if (pushbackVisible) setPushbackVisible(false);
    audioChunksRef.current = [];
    transcriptBaseRef.current = "";
    attemptCountRef.current = 0;
  } else if (autoSpeak && answerMode === null && !autoSpeakUsedRef.current) {
    autoSpeakUsedRef.current = true;
    setAnswerMode("speak");
  }

  const listening =
    active && answerMode === "speak" && micOn && !speakPaused;
  const studentTurn = !active
    ? "none"
    : answerMode === "speak"
      ? "speak"
      : "idle";

  useEffect(() => {
    if (!listening) return;

    const Ctor = getSpeechRecognitionCtor();
    let recognition: SpeechRecognitionLike | undefined;
    let allowRecognitionRestart = true;
    let cancelled = false;
    let stream: MediaStream | null = null;
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

    function startMicRecorder() {
      const Recorder = getMediaRecorderCtor();
      if (!Recorder || !navigator.mediaDevices?.getUserMedia) return;
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((micStream) => {
          if (cancelled) {
            micStream.getTracks().forEach((track) => track.stop());
            return;
          }
          stream = micStream;
          const recorder = new Recorder(micStream);
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };
          recorder.start();
          recorderRef.current = recorder;
        })
        .catch(() => {});
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
        startMicRecorder();
      });
    } else {
      startBrowserRecognition();
      startMicRecorder();
    }

    return () => {
      allowRecognitionRestart = false;
      cancelled = true;
      liveSessionRef.current?.stop();
      liveSessionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.stop();
      }
      const recorder = recorderRef.current;
      recorderRef.current = null;
      recorder?.stop();
      stream?.getTracks?.().forEach((track) => track.stop());
    };
  }, [listening, liveStt]);

  function resetSpeakSession() {
    setSpeakPaused(false);
    audioChunksRef.current = [];
    transcriptBaseRef.current = "";
    setSpokenCaption(null);
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

    const submitVoice = (transcript: string, clip?: Blob) => {
      const result = resolveAttempt(transcript);
      if (result.skip) {
        resetSpeakSession();
        setAnswerMode(null);
        onSubmit({ status: "skipped" });
        return;
      }
      if (!result.store) {
        setPushbackVisible(true);
        resetSpeakSession();
        setAnswerMode(null);
        return;
      }
      onSubmit({
        status: "answered",
        transcript,
        audioClip:
          clip ??
          new Blob(
            audioChunksRef.current.length > 0
              ? audioChunksRef.current
              : [new Blob()],
            { type: "audio/webm" },
          ),
        pushbackCount: result.pushbackCount,
      });
    };

    const finishSpeak = (transcript: string) => {
      const recorder = recorderRef.current;
      if (recorder) {
        recorderRef.current = null;
        recorder.onstop = () => submitVoice(transcript);
        recorder.stop();
        return;
      }
      submitVoice(transcript);
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
        live.stop();
        liveSessionRef.current = null;
        const clip =
          pcm.samples.length > 0
            ? floatToWavBlob(pcm.samples, pcm.sampleRate)
            : undefined;
        submitVoice(committed || spokenCaption || "", clip);
      })();
      return;
    }

    finishSpeak(spokenCaption ?? "");
  }, [answerMode, onSubmit, spokenCaption]);

  return {
    liveCaption: answerMode === "speak" ? spokenCaption : null,
    speakPaused,
    onSpeakAnswer: () => {
      resetSpeakSession();
      setAnswerMode("speak");
    },
    onToggleSpeakPause: () => setSpeakPaused((current) => !current),
    onSubmitClick,
    studentTurn,
    pushbackVisible,
  };
}
