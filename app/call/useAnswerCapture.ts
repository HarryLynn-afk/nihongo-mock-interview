import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerSubmission } from "./useQuestionFlow";

type AnswerMode = "speak" | "type" | null;

type UseAnswerCaptureArgs = {
  active: boolean;
  micOn: boolean;
  autoSpeak?: boolean;
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
  onSubmit,
}: UseAnswerCaptureArgs) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>(null);
  const [draft, setDraft] = useState("");
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);
  const [speakPaused, setSpeakPaused] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptBaseRef = useRef("");
  const recorderRef = useRef<MediaRecorderLike | null>(null);
  const autoSpeakUsedRef = useRef(false);

  if (!active) {
    autoSpeakUsedRef.current = false;
    if (answerMode !== null) setAnswerMode(null);
    if (draft !== "") setDraft("");
    if (spokenCaption !== null) setSpokenCaption(null);
    if (speakPaused) setSpeakPaused(false);
    audioChunksRef.current = [];
    transcriptBaseRef.current = "";
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
    if (Ctor) {
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
      };
      recognition.start();
    }

    let cancelled = false;
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
      if (recognition) {
        recognition.onresult = null;
        recognition.stop();
      }
      const recorder = recorderRef.current;
      recorderRef.current = null;
      recorder?.stop();
      stream?.getTracks?.().forEach((track) => track.stop());
    };
  }, [listening]);

  function resetSpeakSession() {
    setSpeakPaused(false);
    audioChunksRef.current = [];
    transcriptBaseRef.current = "";
    setSpokenCaption(null);
  }

  const onSubmitClick = useCallback(() => {
    if (answerMode === "type") {
      onSubmit({ inputMode: "typed", transcript: draft });
      return;
    }
    if (answerMode === "speak" && spokenCaption) {
      const submitVoice = () => {
        onSubmit({
          inputMode: "voice",
          transcript: spokenCaption,
          audioClip: new Blob(
            audioChunksRef.current.length > 0
              ? audioChunksRef.current
              : [new Blob()],
            { type: "audio/webm" },
          ),
        });
      };
      const recorder = recorderRef.current;
      if (recorder) {
        recorderRef.current = null;
        recorder.onstop = submitVoice;
        recorder.stop();
        return;
      }
      submitVoice();
      return;
    }
    if (answerMode === "speak") {
      setAnswerMode("type");
    }
  }, [answerMode, onSubmit, draft, spokenCaption]);

  return {
    liveCaption: answerMode === "speak" ? spokenCaption : null,
    speakPaused,
    draft,
    onDraftChange: setDraft,
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
  };
}
