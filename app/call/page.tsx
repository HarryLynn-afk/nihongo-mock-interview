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
import { useQuestionFlow, type StoredAnswer } from "./useQuestionFlow";
import { getPitchCaptions } from "@/lib/content/pitchAnswers";
import { questions } from "@/lib/content/questions";
import { pickSessionQuestions } from "@/lib/content/questionBank";
import type { InterviewQuestion } from "@/lib/content/questions";
import {
  getSampleReport,
  type InterviewReport,
} from "@/lib/content/sampleReport";
import { loadSeenQuestionIds, saveSeenQuestionIds } from "./seenQuestionIds";
import { TryAgainBanner } from "./TryAgainBanner";
import {
  buildUsefulnessView,
  createSessionId,
} from "@/lib/content/survey";
import { useUsefulnessNudge } from "./useUsefulnessNudge";
import { loadDevicePrefs, type DevicePrefs } from "../components/devicePrefs";
import { GUEST_BANNER } from "@/lib/content/studyAuth";

const DEFAULT_DEVICE_PREFS: DevicePrefs = { cameraOn: true, micOn: true };

/** Temporary local preview — remove before Issue 15 deploy. */
const SHOW_SKIP_INTERVIEW = process.env.NODE_ENV !== "production";
const DEBUG_PREVIEW_TRANSCRIPTS = [
  "アウン・ミン・タントです",
  "この学校で日本語を勉強したいです",
  "専門学校でウェブを勉強します",
] as const;
const DEBUG_PREVIEW_ANSWERS: StoredAnswer[] = questions.map(
  (question, questionIndex) => ({
    status: "answered" as const,
    transcript: DEBUG_PREVIEW_TRANSCRIPTS[questionIndex] ?? "はい、そうです。",
    audioClip: new Blob(),
    pushbackCount: 0 as const,
    questionIndex,
    questionId: question.id,
    isFollowUp: false,
  }),
);

export default function CallPage() {
  const [devicePrefs, setDevicePrefs] = useState(DEFAULT_DEVICE_PREFS);
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<
    readonly InterviewQuestion[] | null
  >(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formEnabled, setFormEnabled] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const [usefulnessSubmitted, setUsefulnessSubmitted] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [studyReady, setStudyReady] = useState(false);
  const [previewReport, setPreviewReport] = useState<InterviewReport | null>(
    null,
  );
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
    const guestJoin =
      new URLSearchParams(window.location.search).get("guest") === "1";
    if (guestJoin) {
      setStudyReady(true);
      return;
    }
    void fetch("/api/study/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { participantId?: string | null } | null) => {
        if (data?.participantId) setParticipantId(data.participantId);
      })
      .catch(() => {})
      .finally(() => {
        setStudyReady(true);
      });
  }, []);

  const { cameraState, toggleCamera, videoRef } = useCameraStream({
    startOn: devicePrefs.cameraOn,
  });
  const { micOn, toggleMic } = useMicToggle({ initialOn: devicePrefs.micOn });
  const { phase, currentQuestion, questionIndex, answers, sessionQuestions: flowQuestions, endSenseiTurn, submitAnswer } =
    useQuestionFlow(sessionQuestions, { enableFollowUps: !isPitchMode && sessionQuestions !== null });
  const scribe = useBackgroundScribe({ answers, phase });
  const delivery = useDeliverySignals({ answers, phase });
  const { report: scoredReport } = useInterviewScore(scribe);
  const previewing = previewReport !== null;
  const report = previewReport ?? scoredReport;
  const displayAnswers = previewing ? DEBUG_PREVIEW_ANSWERS : answers;
  const displayQuestions = previewing ? questions : flowQuestions;
  const displayPhase = previewing ? "done" : phase;

  useEffect(() => {
    if (!report || !studyReady) return;
    setSessionId(
      (current) =>
        current ??
        createSessionId(participantId ? "participant" : "guest"),
    );
  }, [report, studyReady, participantId]);

  useEffect(() => {
    if (!report || previewing) return;
    fetch("/api/survey")
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => {
        setFormEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        setFormEnabled(false);
      });
  }, [report, previewing]);

  useEffect(() => {
    if (!report || !participantId || savedStudyRef.current || previewing) return;
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
  }, [report, participantId, answers, previewing]);

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
    active: phase === "studentAnswering" && !previewing,
    micOn,
    autoSpeak: isPitchMode,
    liveStt: !isPitchMode,
    onSubmit: (submission) => {
      submitAnswer(submission);
    },
  });

  useEffect(() => {
    if (previewing || !currentQuestion) return;

    let cancelled = false;
    const playback = playQuestionAudio(currentQuestion.id);
    playback.ended.then(() => {
      if (!cancelled) endSenseiTurn();
    });
    return () => {
      cancelled = true;
      playback.stop();
    };
  }, [currentQuestion, endSenseiTurn, previewing]);

  function handleSpeakAnswer() {
    if (!micOn) toggleMic();
    onSpeakAnswer();
  }

  const pitchCaptions =
    isPitchMode && phase === "studentAnswering" && questionIndex !== null
      ? getPitchCaptions(questionIndex)
      : null;
  const allSkipped =
    displayPhase === "done" &&
    displayAnswers.length > 0 &&
    displayAnswers.every((answer) => answer.status === "skipped");
  const usefulnessView =
    sessionId === null
      ? null
      : buildUsefulnessView({
          isPitchMode,
          formEnabled,
          sessionId,
        });
  const { open: usefulnessOpen, openNow: openUsefulness, close: closeUsefulness } =
    useUsefulnessNudge(Boolean(usefulnessView && revealDone));
  const classroomLocked = displayPhase !== "done";
  return (
    <div
      data-testid="call-screen"
      className={
        classroomLocked
          ? "flex h-dvh flex-col overflow-hidden bg-ink p-3 md:p-4"
          : "min-h-screen overflow-y-auto bg-ink p-4 md:p-6"
      }
    >
      <div
        className={
          classroomLocked
            ? "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col items-center gap-3"
            : "mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col items-center gap-5 md:min-h-[calc(100vh-3rem)] md:gap-6"
        }
      >
        {!isPitchMode && !participantId ? (
          <p className="w-full shrink-0 rounded-xl border border-paper/15 bg-paper/5 px-4 py-2 text-center text-sm text-paper/80">
            {GUEST_BANNER}
          </p>
        ) : null}
        {participantId ? (
          <p className="w-full text-center text-sm text-paper/70">
            Participant {participantId}
          </p>
        ) : null}
        {pushbackVisible && !previewing ? <TryAgainBanner /> : null}
        {SHOW_SKIP_INTERVIEW &&
        !isPitchMode &&
        !previewing &&
        phase !== "done" ? (
          <button
            type="button"
            onClick={() => {
              setPreviewReport(getSampleReport(null));
              setFormEnabled(true);
            }}
            className="self-end text-xs text-paper/40 underline-offset-2 hover:text-paper/70 hover:underline"
          >
            Skip interview
          </button>
        ) : null}
        <div
          data-testid="call-stage"
          className={
            classroomLocked
              ? "flex min-h-0 w-full flex-1 flex-col items-stretch gap-3 md:flex-row md:gap-4"
              : "flex w-full flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-5"
          }
        >
          {displayPhase === "done" && allSkipped ? (
            <MicTroubleScreen />
          ) : displayPhase === "done" && report ? (
            <InterviewReportScreen
              view={buildReportView({
                report,
                sessionQuestions: displayQuestions,
                answers: displayAnswers.map((answer) =>
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
                delivery: previewing
                  ? null
                  : delivery.status === "ready"
                    ? delivery.delivery
                    : null,
              })}
              sessionId={sessionId ?? undefined}
              onRevealComplete={() => setRevealDone(true)}
              onHelpStudy={
                usefulnessView && !usefulnessSubmitted
                  ? openUsefulness
                  : undefined
              }
            />
          ) : (
            <>
              <InterviewSidebar
                phase={phase}
                answers={answers}
                sessionQuestions={flowQuestions}
              />
              <div
                data-testid="classroom-row"
                className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 md:flex-row md:gap-4"
              >
                <div
                  data-testid="sensei-stage"
                  className="relative min-h-48 min-w-0 flex-1"
                >
                  <SenseiTile />
                  {currentQuestion ? (
                    <LanguageHud
                      speaker={
                        phase === "studentAnswering" ? "student" : "sensei"
                      }
                      caption={currentQuestion.japanese}
                      liveCaption={
                        studentTurn === "speak" ? null : liveCaption
                      }
                      english={
                        phase === "studentAnswering"
                          ? (pitchCaptions?.english ??
                            currentQuestion.englishTranslation)
                          : null
                      }
                      burmese={
                        phase === "studentAnswering"
                          ? (pitchCaptions?.burmese ??
                            currentQuestion.burmeseTranslation)
                          : null
                      }
                    />
                  ) : null}
                </div>
                <div
                  data-testid="student-stage"
                  className="w-40 shrink-0 self-end md:w-44"
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

        {usefulnessView && report && !allSkipped && usefulnessOpen ? (
          <UsefulnessStep
            view={usefulnessView}
            report={report}
            answers={displayAnswers.map((answer) => ({
              questionIndex: answer.questionIndex,
              pushbackCount:
                answer.status === "answered" ? answer.pushbackCount : 2,
              forced: false,
            }))}
            onFinished={(outcome) => {
              closeUsefulness();
              if (outcome === "submitted") setUsefulnessSubmitted(true);
            }}
          />
        ) : null}

        {displayPhase === "done" || studentTurn === "none" ? null : (
          <div
            data-testid="answer-dock"
            className="flex w-full max-w-xl shrink-0 flex-col items-center gap-3 rounded-2xl border border-paper/10 bg-ink/90 px-5 py-3"
          >
          {studentTurn === "speak" ? (
            <div
              data-testid="live-transcript"
              className="w-full rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3 text-center"
            >
              <p className="text-xs font-medium tracking-wide text-paper/60">
                Live transcript
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-paper">
                {liveCaption ??
                  (speakPaused ? "Paused" : "Listening…")}
              </p>
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-3">
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
