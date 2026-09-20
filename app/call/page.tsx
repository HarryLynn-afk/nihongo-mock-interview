"use client";

import { useEffect, useRef, useState } from "react";
import { InterviewSidebar } from "./InterviewSidebar";
import { InterviewReportScreen } from "./InterviewReportScreen";
import { LanguageHud } from "./LanguageHud";
import { MicTroubleScreen } from "./MicTroubleScreen";
import { SpeakAnswerButton } from "./SpeakAnswerButton";
import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { UsefulnessStep } from "./UsefulnessStep";
import { buildReportView } from "./buildReportView";
import { playQuestionAudio } from "./playQuestionAudio";
import { useAnswerCapture } from "./useAnswerCapture";
import { useBackgroundScribe } from "./useBackgroundScribe";
import { useDeliverySignals } from "./useDeliverySignals";
import { useCameraStream } from "./useCameraStream";
import { useInterviewScore } from "./useInterviewScore";
import { useMicToggle } from "./useMicToggle";
import { useQuestionFlow } from "./useQuestionFlow";
import { getPitchCaptions } from "@/lib/content/pitchAnswers";
import { questions } from "@/lib/content/questions";
import { pickSessionQuestions } from "@/lib/content/questionBank";
import type { InterviewQuestion } from "@/lib/content/questions";
import { loadSeenQuestionIds, saveSeenQuestionIds } from "./seenQuestionIds";
import { TryAgainBanner } from "./TryAgainBanner";
import {
  buildUsefulnessView,
  createSessionId,
} from "@/lib/content/survey";
import { loadDevicePrefs, type DevicePrefs } from "../components/devicePrefs";
import { GUEST_BANNER } from "@/lib/content/studyAuth";

const DEFAULT_DEVICE_PREFS: DevicePrefs = { cameraOn: true, micOn: true };

export default function CallPage() {
  const [devicePrefs, setDevicePrefs] = useState(DEFAULT_DEVICE_PREFS);
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<
    readonly InterviewQuestion[] | null
  >(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formEnabled, setFormEnabled] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const savedStudyRef = useRef(false);

  useEffect(() => {
    setDevicePrefs(loadDevicePrefs());
    const pitch =
      new URLSearchParams(window.location.search).get("pitch") === "1";
    setIsPitchMode(pitch);
    if (pitch) {
      setSessionQuestions(questions);
      return;
    }
    const seen = loadSeenQuestionIds();
    const picked = pickSessionQuestions(Math.random, seen);
    saveSeenQuestionIds([...seen, ...picked.map((item) => item.id)]);
    setSessionQuestions(picked);
  }, []);

  useEffect(() => {
    void fetch("/api/study/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { participantId?: string | null } | null) => {
        if (data?.participantId) setParticipantId(data.participantId);
      })
      .catch(() => {});
  }, []);

  const { cameraState, toggleCamera, videoRef } = useCameraStream({
    startOn: devicePrefs.cameraOn,
  });
  const { micOn, toggleMic } = useMicToggle({ initialOn: devicePrefs.micOn });
  const { phase, currentQuestion, questionIndex, answers, sessionQuestions: flowQuestions, endSenseiTurn, submitAnswer } =
    useQuestionFlow(sessionQuestions, { enableFollowUps: !isPitchMode && sessionQuestions !== null });
  const scribe = useBackgroundScribe({ answers, phase });
  const delivery = useDeliverySignals({ answers, phase });
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

  useEffect(() => {
    if (!report || !participantId || savedStudyRef.current) return;
    savedStudyRef.current = true;
    void fetch("/api/study/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: report.headline,
        total: report.total,
        source: report.source,
        answers: answers.map((answer) => ({
          questionIndex: answer.questionIndex,
          status: answer.status,
          transcript: answer.status === "answered" ? answer.transcript : "",
          pushbackCount:
            answer.status === "answered" ? answer.pushbackCount : 2,
          isFollowUp: answer.isFollowUp,
        })),
        scores: report.scores,
        pushbackCount: answers.reduce(
          (sum, answer) =>
            sum + (answer.status === "answered" ? answer.pushbackCount : 0),
          0,
        ),
        followUpCount: answers.filter((answer) => answer.isFollowUp).length,
      }),
    }).catch(() => {});
  }, [report, participantId, answers]);

  const {
    liveCaption,
    speakPaused,
    onSpeakAnswer,
    onToggleSpeakPause,
    onSubmitClick,
    submitPending,
    studentTurn,
    pushbackVisible,
  } = useAnswerCapture({
    active: phase === "studentAnswering",
    micOn,
    autoSpeak: isPitchMode,
    liveStt: !isPitchMode,
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
  const allSkipped =
    phase === "done" &&
    answers.length > 0 &&
    answers.every((answer) => answer.status === "skipped");
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
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col items-center gap-5 md:min-h-[calc(100vh-3rem)] md:gap-6">
        {!isPitchMode && !participantId ? (
          <p className="w-full rounded-xl border border-paper/15 bg-paper/5 px-4 py-2 text-center text-sm text-paper/80">
            {GUEST_BANNER}
          </p>
        ) : null}
        {participantId ? (
          <p className="w-full text-center text-sm text-paper/70">
            Participant {participantId}
          </p>
        ) : null}
        {pushbackVisible ? <TryAgainBanner /> : null}
        <div
          data-testid="call-stage"
          className="flex w-full flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-5"
        >
          {phase === "done" && allSkipped ? (
            <MicTroubleScreen />
          ) : phase === "done" && report ? (
            <InterviewReportScreen
              view={buildReportView({
                report,
                sessionQuestions: flowQuestions,
                answers: answers.map((answer) =>
                  answer.status === "answered"
                    ? {
                        questionIndex: answer.questionIndex,
                        status: "answered" as const,
                        transcript: answer.transcript,
                      }
                    : {
                        questionIndex: answer.questionIndex,
                        status: "skipped" as const,
                      },
                ),
                delivery:
                  delivery.status === "ready" ? delivery.delivery : null,
              })}
              sessionId={sessionId ?? undefined}
              onRevealComplete={() => setRevealDone(true)}
            />
          ) : (
            <>
              <InterviewSidebar
                phase={phase}
                answers={answers}
                sessionQuestions={flowQuestions}
              />
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
            </>
          )}
        </div>

        {usefulnessView && report && !allSkipped ? (
          <UsefulnessStep
            view={usefulnessView}
            report={report}
            answers={answers.map((answer) => ({
              questionIndex: answer.questionIndex,
              pushbackCount:
                answer.status === "answered" ? answer.pushbackCount : 2,
              forced: false,
            }))}
          />
        ) : null}

        {phase !== "done" && currentQuestion ? (
          <LanguageHud
            speaker={phase === "studentAnswering" ? "student" : "sensei"}
            caption={currentQuestion.japanese}
            liveCaption={studentTurn === "speak" ? null : liveCaption}
            english={
              phase === "studentAnswering"
                ? (pitchCaptions?.english ?? currentQuestion.englishTranslation)
                : null
            }
            burmese={
              phase === "studentAnswering"
                ? (pitchCaptions?.burmese ?? currentQuestion.burmeseTranslation)
                : null
            }
          />
        ) : null}

        {phase === "done" ? null : (
          <div
            data-testid="answer-dock"
            className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-paper/10 bg-ink/90 px-5 py-4"
          >
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
            {studentTurn === "idle" ? (
              <SpeakAnswerButton
                listening={false}
                onClick={handleSpeakAnswer}
              />
            ) : null}
            {studentTurn === "speak" ? (
              <SpeakAnswerButton
                listening={!speakPaused}
                paused={speakPaused}
                onClick={onToggleSpeakPause}
              />
            ) : null}
            {studentTurn === "speak" ? (
              <button
                type="button"
                onClick={onSubmitClick}
                disabled={submitPending}
                className="rounded-full bg-indigo px-6 py-3 font-medium text-paper transition-colors hover:bg-indigo/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit answer
              </button>
            ) : null}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
