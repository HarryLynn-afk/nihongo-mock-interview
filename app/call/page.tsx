"use client";

import { useEffect } from "react";
import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { playQuestionAudio } from "./playQuestionAudio";
import { useCameraStream } from "./useCameraStream";
import { useMicToggle } from "./useMicToggle";
import { useQuestionFlow } from "./useQuestionFlow";

export default function CallPage() {
  const { cameraState, toggleCamera, videoRef } = useCameraStream();
  const { micOn, toggleMic } = useMicToggle();
  const { phase, currentQuestion, submitAnswer } = useQuestionFlow();

  // Warm the n8n grading workflow the moment Join lands us here.
  // Fire-and-forget — failure must never block or slow the interview.
  useEffect(() => {
    fetch("/api/warm-n8n", { method: "POST" }).catch(() => {});
  }, []);

  // Play each new question's audio as it becomes current.
  useEffect(() => {
    if (currentQuestion) {
      playQuestionAudio(currentQuestion.id);
    }
  }, [currentQuestion]);

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

      {/*
        Temporary answer-submit control — Issue 7 will replace this with
        the real Wispr/browser-speech input + "Type instead" flow.
      */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        {phase === "asking" ? (
          <button
            type="button"
            onClick={submitAnswer}
            className="rounded-full bg-indigo px-6 py-3 font-medium text-paper transition-colors hover:bg-indigo/90"
          >
            Submit answer
          </button>
        ) : (
          <p className="rounded-full bg-paper/10 px-6 py-3 font-medium text-paper">
            Interview complete
          </p>
        )}
      </div>
    </div>
  );
}
