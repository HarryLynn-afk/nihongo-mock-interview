"use client";

import { useEffect, useState } from "react";
import { InterviewSidebar } from "./InterviewSidebar";
import { InterviewReportScreen } from "./InterviewReportScreen";
import { LanguageHud } from "./LanguageHud";
import { SpeakAnswerButton } from "./SpeakAnswerButton";
import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { UsefulnessStep } from "./UsefulnessStep";
import { buildReportView } from "./buildReportView";
import { playQuestionAudio } from "./playQuestionAudio";
import { useAnswerCapture } from "./useAnswerCapture";
import { useBackgroundScribe } from "./useBackgroundScribe";
import { useCameraStream } from "./useCameraStream";
import { useInterviewScore } from "./useInterviewScore";
import { useMicToggle } from "./useMicToggle";
import { useQuestionFlow } from "./useQuestionFlow";
import { getPitchCaptions } from "@/lib/content/pitchAnswers";
import { PUSHBACK_TRY_AGAIN } from "@/lib/content/pushbackCopy";
import {
  buildUsefulnessView,
  createSessionId,
} from "@/lib/content/survey";
import { loadDevicePrefs, type DevicePrefs } from "../components/devicePrefs";

const DEFAULT_DEVICE_PREFS: DevicePrefs = { cameraOn: true, micOn: true };

export default function CallPage() {
  const [devicePrefs, setDevicePrefs] = useState(DEFAULT_DEVICE_PREFS);
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formEnabled, setFormEnabled] = useState(false);
  const [revealDone, setRevealDone] = useState(false);

  useEffect(() => {
    setDevicePrefs(loadDevicePrefs());
    setIsPitchMode(
      new URLSearchParams(window.location.search).get("pitch") === "1",
    );
  }, []);

  const { cameraState, toggleCamera, videoRef } = useCameraStream({
    startOn: devicePrefs.cameraOn,
  });
  const { micOn, toggleMic } = useMicToggle({ initialOn: devicePrefs.micOn });
  const { phase, currentQuestion, questionIndex, answers, endSenseiTurn, submitAnswer } =
    useQuestionFlow();
  const scribe = useBackgroundScribe({ answers, phase });
  const { report } = useInterviewScore(scribe);

  useEffect(() => {
    if (!report) return;
    setSessionId((current) => current ?? createSessionId());
  }, [report]);

  useEffect(() => {
    if (!report) return;
    fetch("/api/survey")
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => {
        setFormEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        setFormEnabled(false);
      });
  }, [report]);

  const {
    liveCaption,
    speakPaused,
    draft,
    onDraftChange,
    onSpeakAnswer,
    onToggleSpeakPause,
    onTypeAnswer,
    onSpeakOrType,
    onSubmitClick,
    studentTurn,
    pushbackVisible,
  } = useAnswerCapture({
    active: phase === "studentAnswering",
    micOn,
    autoSpeak: isPitchMode,
    onSubmit: (submission) => {
      submitAnswer(submission);
    },
  });

  useEffect(() => {
    if (!currentQuestion) return;

    let cancelled = false;
    const playback = playQuestionAudio(currentQuestion.id);
    playback.ended.then(() => {
      if (!cancelled) endSenseiTurn();
    });
    return () => {
      cancelled = true;
      playback.stop();
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
  const usefulnessView =
    sessionId === null
      ? null
      : buildUsefulnessView({
          isPitchMode,
          formEnabled,
          revealDone,
          sessionId,
        });
  return (
    <div
      data-testid="call-screen"
      className="min-h-screen overflow-y-auto bg-ink p-4 md:p-6"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col items-center gap-5 md:min-h-[calc(100vh-3rem)] md:gap-6">
        <div
          data-testid="call-stage"
          className="flex w-full flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-5"
        >
          <InterviewSidebar phase={phase} answers={answers} />
          {phase === "done" && report ? (
            <InterviewReportScreen
              view={buildReportView({
                report,
                answers: answers.map(({ questionIndex: index, inputMode }) => ({
                  questionIndex: index,
                  inputMode,
                })),
              })}
              sessionId={sessionId ?? undefined}
              onRevealComplete={() => setRevealDone(true)}
            />
          ) : (
            <div data-testid="sensei-stage" className="relative min-w-0 flex-1">
              <SenseiTile />
              <div
                data-testid="student-inset"
                className="absolute bottom-3 right-3 z-10 w-36 sm:w-44 md:w-52"
              >
                <StudentTile
                  cameraState={cameraState}
                  micOn={micOn}
                  videoRef={videoRef}
                  onToggleCamera={toggleCamera}
                  onToggleMic={toggleMic}
                />
              </div>
            </div>
          )}
        </div>

        {usefulnessView && report ? (
          <UsefulnessStep
            view={usefulnessView}
            report={report}
            answers={answers.map(
              ({ questionIndex: index, pushbackCount, forced }) => ({
                questionIndex: index,
                pushbackCount,
                forced,
              }),
            )}
          />
        ) : null}

        {phase !== "done" && currentQuestion ? (
          <LanguageHud
            speaker={phase === "studentAnswering" ? "student" : "sensei"}
            caption={currentQuestion.japanese}
            liveCaption={studentTurn === "speak" ? null : liveCaption}
            english={pitchCaptions?.english ?? null}
            burmese={pitchCaptions?.burmese ?? null}
            tryAgain={pushbackVisible ? PUSHBACK_TRY_AGAIN : null}
          />
        ) : null}

        <div
          data-testid="answer-dock"
          className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-paper/10 bg-ink/90 px-5 py-4"
        >
          {phase === "studentAnswering" && studentTurn === "type" ? (
            <textarea
              aria-label="Answer"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              className="h-24 w-full rounded-xl border border-indigo/30 bg-ink px-4 py-3 text-paper"
            />
          ) : null}
          {studentTurn === "speak" ? (
            <div
              data-testid="live-transcript"
              className="w-full rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4 text-center"
            >
              <p className="text-xs font-medium tracking-wide text-paper/60">
                Live transcript
              </p>
              <p className="mt-2 text-lg leading-relaxed text-paper">
                {liveCaption ??
                  (speakPaused ? "Paused" : "Listening…")}
              </p>
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-4">
            {studentTurn === "choose" ? (
              <div className="flex items-center gap-3">
                <SpeakAnswerButton
                  listening={false}
                  onClick={handleSpeakAnswer}
                />
                <button
                  type="button"
                  onClick={onTypeAnswer}
                  className="rounded-full bg-paper/10 px-5 py-3 font-medium text-paper"
                >
                  Type answer
                </button>
              </div>
            ) : null}
            {studentTurn === "speak" ? (
              <SpeakAnswerButton
                listening={!speakPaused}
                paused={speakPaused}
                onClick={onToggleSpeakPause}
              />
            ) : null}
            {studentTurn === "speak" || studentTurn === "type" ? (
              <button
                type="button"
                onClick={onSpeakOrType}
                className="rounded-full bg-paper/10 px-5 py-3 font-medium text-paper"
              >
                Speak or type
              </button>
            ) : null}
            {studentTurn === "speak" || studentTurn === "type" ? (
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
    </div>
  );
}
