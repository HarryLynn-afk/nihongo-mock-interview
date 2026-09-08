import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerSubmission } from "./useQuestionFlow";
import { transcriptPassesPushbackCheck } from "@/lib/content/pushbackCheck";
import { startLiveTranscriptionSession } from "./startLiveTranscription";
import type { LiveTranscriptionSession } from "./startLiveTranscription";

type AnswerMode = "speak" | "type" | null;

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
  const [draft, setDraft] = useState("");
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);
  const [speakPaused, setSpeakPaused] = useState(false);
  const [pushbackVisible, setPushbackVisible] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptBaseRef = useRef("");
  const recorderRef = useRef<MediaRecorderLike | null>(null);
  const autoSpeakUsedRef = useRef(false);
  const attemptCountRef = useRef(0);
  const liveSessionRef = useRef<LiveTranscriptionSession | null>(null);
  const completedWaitersRef = useRef<Array<(text: string) => void>>([]);

  if (!active) {
    autoSpeakUsedRef.current = false;
    if (answerMode !== null) setAnswerMode(null);
    if (draft !== "") setDraft("");
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
      : answerMode === "type"
        ? "type"
        : "choose";

  useEffect(() => {
    if (!listening) return;

    const Ctor = getSpeechRecognitionCtor();
    let recognition: SpeechRecognitionLike | undefined;
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
      recognition.start();
    }

    let cancelled = false;
    if (liveStt) {
      void startLiveTranscriptionSession({
        onEvent: (event) => {
          if (event.kind === "delta") {
            setSpokenCaption(transcriptBaseRef.current + event.delta);
            if (event.delta) setPushbackVisible(false);
            return;
          }
          transcriptBaseRef.current = event.transcript;
          setSpokenCaption(event.transcript);
          completedWaitersRef.current.splice(0).forEach((wait) => wait(event.transcript));
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
      });
    } else {
      startBrowserRecognition();
    }
    let stream: MediaStream | null = null;
    const Recorder = getMediaRecorderCtor();
    if (Recorder && navigator.mediaDevices?.getUserMedia) {
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

    return () => {
      cancelled = true;
      liveSessionRef.current?.stop();
      liveSessionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
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

  function resolvePushback(transcript: string): {
    store: boolean;
    pushbackCount: 0 | 1 | 2;
    forced: boolean;
  } {
    attemptCountRef.current += 1;
    const attempts = attemptCountRef.current;
    const passed = transcriptPassesPushbackCheck(transcript);
    const forced = !passed && attempts >= 3;
    return {
      store: passed || forced,
      pushbackCount: (passed ? attempts - 1 : 2) as 0 | 1 | 2,
      forced,
    };
  }

  const onSubmitClick = useCallback(() => {
    if (answerMode === "type") {
      const result = resolvePushback(draft);
      if (result.store) {
        onSubmit({
          inputMode: "typed",
          transcript: draft,
          pushbackCount: result.pushbackCount,
          forced: result.forced,
        });
        return;
      }
      setPushbackVisible(true);
      return;
    }
    if (answerMode !== "speak") return;

    const submitVoice = (transcript: string) => {
      const result = resolvePushback(transcript);
      if (!result.store) {
        setPushbackVisible(true);
        if (!transcript) setAnswerMode("type");
        return;
      }
      onSubmit({
        inputMode: "voice",
        transcript,
        audioClip: new Blob(
          audioChunksRef.current.length > 0
            ? audioChunksRef.current
            : [new Blob()],
          { type: "audio/webm" },
        ),
        pushbackCount: result.pushbackCount,
        forced: result.forced,
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
        const committed = await new Promise<string | null>((resolve) => {
          const timer = window.setTimeout(() => resolve(null), 2000);
          completedWaitersRef.current.push((text) => {
            window.clearTimeout(timer);
            resolve(text);
          });
          live.commit();
        });
        live.stop();
        liveSessionRef.current = null;
        finishSpeak(committed ?? spokenCaption ?? "");
      })();
      return;
    }

    finishSpeak(spokenCaption ?? "");
  }, [answerMode, onSubmit, draft, spokenCaption]);

  return {
    liveCaption: answerMode === "speak" ? spokenCaption : null,
    speakPaused,
    draft,
    onDraftChange: (value: string) => {
      if (pushbackVisible) setPushbackVisible(false);
      setDraft(value);
    },
    onSpeakAnswer: () => {
      resetSpeakSession();
      setAnswerMode("speak");
    },
    onToggleSpeakPause: () => setSpeakPaused((current) => !current),
    onTypeAnswer: () => setAnswerMode("type"),
    onSpeakOrType: () => {
      resetSpeakSession();
      setAnswerMode(null);
      setDraft("");
    },
    onSubmitClick,
    studentTurn,
    pushbackVisible,
  };
}
