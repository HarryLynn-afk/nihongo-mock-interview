"use client";

import { useEffect } from "react";
import { LanguageHud } from "./LanguageHud";
import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { playQuestionAudio } from "./playQuestionAudio";
import { useAnswerCapture } from "./useAnswerCapture";
import { useCameraStream } from "./useCameraStream";
import { useMicToggle } from "./useMicToggle";
import { useQuestionFlow } from "./useQuestionFlow";

export default function CallPage() {
  const { cameraState, toggleCamera, videoRef } = useCameraStream();
  const { micOn, toggleMic } = useMicToggle();
  const { phase, currentQuestion, endSenseiTurn, submitAnswer } =
    useQuestionFlow();
  const {
    liveCaption,
    showAnswerBox,
    typeInsteadVisible,
    draft,
    onDraftChange,
    onTypeInstead,
    onSubmitClick,
  } = useAnswerCapture({
    active: phase === "studentAnswering",
    micOn,
    onSubmit: submitAnswer,
  });

  // Warm the n8n grading workflow the moment Join lands us here.
  // Fire-and-forget — failure must never block or slow the interview.
  useEffect(() => {
    fetch("/api/warm-n8n", { method: "POST" }).catch(() => {});
  }, []);

  // Play each new question's audio as it becomes current.
  useEffect(() => {
    if (!currentQuestion) return;

    let cancelled = false;
    playQuestionAudio(currentQuestion.id).then(() => {
      if (!cancelled) endSenseiTurn();
    });
    return () => {
      cancelled = true;
    };
  }, [currentQuestion, endSenseiTurn]);

  const hudCaption =
    phase === "senseiSpeaking"
      ? (currentQuestion?.japanese ?? null)
      : (liveCaption ?? null);

  return (
    <div
      data-testid="call-screen"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink p-6 md:flex-row"
    >
      <div className="w-full max-w-md">
        <StudentTile
          cameraState={cameraState}
          micOn={micOn}
          videoRef={videoRef}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
        />
      </div>
      <div className="w-full max-w-md">
        <SenseiTile />
      </div>

      {phase !== "done" && currentQuestion ? (
        <div className="fixed inset-x-0 bottom-24 flex justify-center px-6">
          <LanguageHud
            speaker={phase === "studentAnswering" ? "student" : "sensei"}
            caption={hudCaption}
          />
        </div>
      ) : null}

      <div className="fixed bottom-6 left-1/2 flex w-full max-w-xl -translate-x-1/2 flex-col items-center gap-3 px-6">
        {phase === "studentAnswering" && showAnswerBox ? (
          <textarea
            aria-label="Answer"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="h-24 w-full rounded-xl border border-indigo/30 bg-ink px-4 py-3 text-paper"
          />
        ) : null}
        <div className="flex items-center gap-3">
          {phase === "studentAnswering" && typeInsteadVisible ? (
            <button
              type="button"
              onClick={onTypeInstead}
              className="rounded-full bg-paper/10 px-5 py-3 font-medium text-paper"
            >
              Type instead
            </button>
          ) : null}
          {phase === "studentAnswering" ? (
            <button
              type="button"
              onClick={onSubmitClick}
              className="rounded-full bg-indigo px-6 py-3 font-medium text-paper transition-colors hover:bg-indigo/90"
            >
              Submit answer
            </button>
          ) : phase === "done" ? (
            <p className="rounded-full bg-paper/10 px-6 py-3 font-medium text-paper">
              Interview complete
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
