import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerSubmission } from "./useQuestionFlow";

type UseAnswerCaptureArgs = {
  active: boolean;
  micOn: boolean;
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
  onSubmit,
}: UseAnswerCaptureArgs) {
  const [typedInstead, setTypedInstead] = useState(false);
  const [draft, setDraft] = useState("");
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);
  const audioClipRef = useRef<Blob | null>(null);

  if (!active) {
    if (typedInstead) setTypedInstead(false);
    if (draft !== "") setDraft("");
    if (spokenCaption !== null) setSpokenCaption(null);
  }

  const showAnswerBox = !micOn || typedInstead;
  const typeInsteadVisible = micOn && !showAnswerBox;
  const listening = active && micOn && !showAnswerBox;

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
    if (showAnswerBox) {
      onSubmit({ inputMode: "typed", transcript: draft });
      return;
    }
    if (spokenCaption) {
      onSubmit({
        inputMode: "voice",
        transcript: spokenCaption,
        audioClip: audioClipRef.current ?? new Blob(),
      });
      return;
    }
    setTypedInstead(true);
  }, [showAnswerBox, onSubmit, draft, spokenCaption]);

  return {
    liveCaption: listening ? spokenCaption : null,
    showAnswerBox,
    typeInsteadVisible,
    draft,
    onDraftChange: setDraft,
    onTypeInstead: () => setTypedInstead(true),
    onSubmitClick,
  };
}
