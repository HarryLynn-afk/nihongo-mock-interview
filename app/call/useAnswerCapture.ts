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
  onSubmit,
}: UseAnswerCaptureArgs) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>(null);
  const [draft, setDraft] = useState("");
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);
  const audioClipRef = useRef<Blob | null>(null);

  if (!active) {
    if (answerMode !== null) setAnswerMode(null);
    if (draft !== "") setDraft("");
    if (spokenCaption !== null) setSpokenCaption(null);
  } else if (autoSpeak && answerMode === null) {
    setAnswerMode("speak");
  }

  const showAnswerBox = active && answerMode === "type";
  const speakAnswerVisible = active && answerMode === null;
  const typeAnswerVisible = active && answerMode !== "type";
  const submitVisible = active && answerMode !== null;
  const listening = active && answerMode === "speak" && micOn;

  useEffect(() => {
    if (!listening) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      setSpokenCaption(last[0].transcript);
    };
    recognition.start();
    return () => {
      recognition.onresult = null;
      recognition.stop();
    };
  }, [listening]);

  const onSubmitClick = useCallback(() => {
    if (answerMode === "type") {
      onSubmit({ inputMode: "typed", transcript: draft });
      return;
    }
    if (answerMode === "speak" && spokenCaption) {
      onSubmit({
        inputMode: "voice",
        transcript: spokenCaption,
        audioClip: audioClipRef.current ?? new Blob(),
      });
      return;
    }
    if (answerMode === "speak") {
      setAnswerMode("type");
    }
  }, [answerMode, onSubmit, draft, spokenCaption]);

  return {
    liveCaption: listening ? spokenCaption : null,
    showAnswerBox,
    speakAnswerVisible,
    typeAnswerVisible,
    submitVisible,
    draft,
    onDraftChange: setDraft,
    onSpeakAnswer: () => setAnswerMode("speak"),
    onTypeAnswer: () => setAnswerMode("type"),
    onSubmitClick,
  };
}
