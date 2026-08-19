"use client";

import { useCallback, useEffect, useState } from "react";
import { InterviewSidebar } from "./InterviewSidebar";
import { InterviewReportScreen } from "./InterviewReportScreen";
import { LanguageHud } from "./LanguageHud";
import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { buildReportView } from "./buildReportView";
import { selectDisplayedReport } from "./selectDisplayedReport";
import { playQuestionAudio } from "./playQuestionAudio";
import { useAnswerCapture } from "./useAnswerCapture";
import { useBackgroundScribe } from "./useBackgroundScribe";
import { useCameraStream } from "./useCameraStream";
import { useInterviewScore } from "./useInterviewScore";
import { useMicToggle } from "./useMicToggle";
import { useQuestionFlow } from "./useQuestionFlow";
import { getPitchCaptions } from "@/lib/content/pitchAnswers";
import { loadDevicePrefs } from "../components/devicePrefs";

export default function CallPage() {
  const prefs = loadDevicePrefs();
  const { cameraState, toggleCamera, videoRef } = useCameraStream({
    startOn: prefs.cameraOn,
  });
  const { micOn, toggleMic } = useMicToggle({ initialOn: prefs.micOn });
  const { phase, currentQuestion, questionIndex, answers, endSenseiTurn, submitAnswer } =
    useQuestionFlow();
  const scribe = useBackgroundScribe({ answers, phase });
  const { report } = useInterviewScore(scribe);

  const isPitchMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("pitch") === "1";

  const [englishOverlay, setEnglishOverlay] = useState<{
    forCaption: string;
    text: string;
  } | null>(null);

  const requestEnglish = useCallback(
    (japanese: string) => {
      if (isPitchMode || japanese.trim().length === 0) return;
      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japanese,
          context: "school interview answer",
        }),
      })
        .then((res) => res.json())
        .then((data: { english?: string | null }) => {
          if (typeof data.english === "string" && data.english.length > 0) {
            setEnglishOverlay({ forCaption: japanese, text: data.english });
          }
        })
        .catch(() => {});
    },
    [isPitchMode],
  );

  const {
    liveCaption,
    showAnswerBox,
    speakAnswerVisible,
    typeAnswerVisible,
    submitVisible,
    draft,
    onDraftChange,
    onSpeakAnswer,
    onTypeAnswer,
    onSubmitClick,
  } = useAnswerCapture({
    active: phase === "studentAnswering",
    micOn,
    autoSpeak: isPitchMode,
    onSubmit: (submission) => {
      requestEnglish(submission.transcript);
      submitAnswer(submission);
    },
  });

  useEffect(() => {
    if (liveCaption) requestEnglish(liveCaption);
  }, [liveCaption, requestEnglish]);

  useEffect(() => {
    fetch("/api/warm-n8n", { method: "POST" }).catch(() => {});
  }, []);

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

  function handleSpeakAnswer() {
    if (!micOn) toggleMic();
    onSpeakAnswer();
  }

  const pitchCaptions =
    isPitchMode && phase === "studentAnswering" && questionIndex !== null
      ? getPitchCaptions(questionIndex)
      : null;
  const liveEnglish =
    englishOverlay && englishOverlay.forCaption === liveCaption
      ? englishOverlay.text
      : null;

  return (
    <div
      data-testid="call-screen"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink p-6 md:flex-row"
    >
      <InterviewSidebar phase={phase} answers={answers} />
      {phase === "done" && report ? (
        <InterviewReportScreen
          view={buildReportView({
            report: selectDisplayedReport({ isPitchMode, live: report }),
            answers: answers.map(({ questionIndex: index, inputMode }) => ({
              questionIndex: index,
              inputMode,
            })),
          })}
        />
      ) : (
        <>
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
        </>
      )}

      {phase !== "done" && currentQuestion ? (
        <div className="fixed inset-x-0 bottom-24 flex justify-center px-6">
          <LanguageHud
            speaker={phase === "studentAnswering" ? "student" : "sensei"}
            caption={currentQuestion.japanese}
            liveCaption={liveCaption}
            english={pitchCaptions?.english ?? liveEnglish}
            burmese={pitchCaptions?.burmese ?? null}
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
          {speakAnswerVisible ? (
            <button
              type="button"
              onClick={handleSpeakAnswer}
              className="rounded-full bg-indigo px-5 py-3 font-medium text-paper"
            >
              Speak answer
            </button>
          ) : null}
          {typeAnswerVisible ? (
            <button
              type="button"
              onClick={onTypeAnswer}
              className="rounded-full bg-paper/10 px-5 py-3 font-medium text-paper"
            >
              Type answer
            </button>
          ) : null}
          {submitVisible ? (
            <button
              type="button"
              onClick={onSubmitClick}
              className="rounded-full bg-indigo px-6 py-3 font-medium text-paper transition-colors hover:bg-indigo/90"
            >
              Submit answer
            </button>
          ) : phase === "done" && !report ? (
            <p className="rounded-full bg-paper/10 px-6 py-3 font-medium text-paper">
              Interview complete
            </p>
          ) : null}
        </div>
        {report?.banner ? (
          <p className="text-sm text-paper/80">{report.banner}</p>
        ) : null}
      </div>
    </div>
  );
}
