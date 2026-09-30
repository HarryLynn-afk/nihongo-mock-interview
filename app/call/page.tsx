"use client";

import { useEffect, useRef, useState } from "react";
import { InterviewSidebar } from "./InterviewSidebar";
import { InterviewReportScreen } from "./InterviewReportScreen";
import { LanguageHud } from "./LanguageHud";
import { MicTroubleScreen } from "./MicTroubleScreen";
import { ScoringUnavailableScreen } from "./ScoringUnavailableScreen";
import { SpeakAnswerButton } from "./SpeakAnswerButton";
import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { UsefulnessStep } from "./UsefulnessStep";
import { FullSessionRequestDialog } from "../components/FullSessionRequestDialog";
import { buildReportView } from "./buildReportView";
import { playQuestionAudio } from "./playQuestionAudio";
import { useAnswerCapture } from "./useAnswerCapture";
import { useGradeAnswers } from "./useGradeAnswers";
import { useDeliverySignals } from "./useDeliverySignals";
import { useCameraStream } from "./useCameraStream";
import { useInterviewScore } from "./useInterviewScore";
import { useMicToggle } from "./useMicToggle";
import { useQuestionFlow, type StoredAnswer } from "./useQuestionFlow";
import {
  callSessionKind,
  followUpsForCallSession,
  questionsForCallSession,
  type CallSessionKind,
} from "@/lib/content/callSession";
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
import { readFullSessionRequestSent } from "@/lib/content/fullSessionRequest";
import { LanguageToggle } from "../components/LanguageToggle";
import { useCopy } from "../components/useUiLocale";
import { helperLinesForLocale } from "@/lib/content/locale";

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
  const [sessionKind, setSessionKind] = useState<CallSessionKind>("participant");
  const [sessionQuestions, setSessionQuestions] = useState<
    readonly InterviewQuestion[] | null
  >(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formEnabled, setFormEnabled] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const [usefulnessSubmitted, setUsefulnessSubmitted] = useState(false);
  const [fullSessionSent, setFullSessionSent] = useState(false);
  const [fullSessionChecked, setFullSessionChecked] = useState(false);
  const [fullSessionStep, setFullSessionStep] = useState<"form" | "saved" | null>(
    null,
  );
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [studyReady, setStudyReady] = useState(false);
  const [previewReport, setPreviewReport] = useState<InterviewReport | null>(
    null,
  );
  const savedStudyRef = useRef(false);
  const { locale, setLocale, copy } = useCopy();

  useEffect(() => {
    // Hydration safety: device prefs (sessionStorage) and the session kind
    // (window.location) must be read after mount, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time external read
    setDevicePrefs(loadDevicePrefs());
    setFullSessionSent(readFullSessionRequestSent());
    setFullSessionChecked(true);
    const kind = callSessionKind(window.location.search);
    setSessionKind(kind);
    setSessionQuestions(
      questionsForCallSession(kind, () => {
        const seen = loadSeenQuestionIds();
        const picked = pickSessionQuestions(Math.random, seen);
        saveSeenQuestionIds([...seen, ...picked.map((item) => item.id)]);
        return picked;
      }),
    );
  }, []);

  useEffect(() => {
    const guestJoin = callSessionKind(window.location.search) === "guest";
    if (guestJoin) {
      // Hydration safety: window.location is only readable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time external read
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
  const { phase, currentQuestion, answers, sessionQuestions: flowQuestions, endSenseiTurn, submitAnswer } =
    useQuestionFlow(sessionQuestions, {
      enableFollowUps:
        followUpsForCallSession(sessionKind) && sessionQuestions !== null,
    });
  const gradeAnswers = useGradeAnswers({ answers, phase });
  const delivery = useDeliverySignals({ answers, phase });
  const { report: scoredReport, scoringFailed } =
    useInterviewScore(gradeAnswers);
  const previewing = previewReport !== null;
  const report = previewReport ?? scoredReport;
  const showScoringUnavailable =
    !previewing && scoringFailed && !scoredReport;
  const displayAnswers = previewing ? DEBUG_PREVIEW_ANSWERS : answers;
  const displayQuestions = previewing ? questions : flowQuestions;
  const displayPhase = previewing ? "done" : phase;

  if (report && studyReady && sessionId === null) {
    setSessionId(createSessionId(participantId ? "participant" : "guest"));
  }

  useEffect(() => {
    if (!report || previewing || sessionKind === "guest") return;
    fetch("/api/survey")
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => {
        setFormEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        setFormEnabled(false);
      });
  }, [report, previewing, sessionKind]);

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
    onAnswerAgain,
    canAnswerAgain,
    onSubmitClick,
    submitPending,
    studentTurn,
    pushbackVisible,
  } = useAnswerCapture({
    active: phase === "studentAnswering" && !previewing,
    micOn,
    liveStt: true,
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

  const hearAgainRef = useRef<{ stop: () => void } | null>(null);
  const [hearAgainPlaying, setHearAgainPlaying] = useState(false);

  function stopHearAgain() {
    hearAgainRef.current?.stop();
    hearAgainRef.current = null;
    setHearAgainPlaying(false);
  }

  useEffect(() => {
    return () => stopHearAgain();
  }, [currentQuestion]);

  function handleHearAgain() {
    if (!currentQuestion) return;
    if (hearAgainPlaying) {
      stopHearAgain();
      return;
    }
    stopHearAgain();
    const playback = playQuestionAudio(currentQuestion.id);
    hearAgainRef.current = playback;
    setHearAgainPlaying(true);
    void playback.ended.then(() => {
      if (hearAgainRef.current === playback) setHearAgainPlaying(false);
    });
  }

  function handleSpeakAnswer() {
    stopHearAgain();
    if (!micOn) toggleMic();
    onSpeakAnswer();
  }

  function handleToggleSpeakPause() {
    if (speakPaused) stopHearAgain();
    onToggleSpeakPause();
  }

  function handleAnswerAgain() {
    stopHearAgain();
    onAnswerAgain();
  }

  const helperLines =
    phase === "studentAnswering" && currentQuestion
      ? helperLinesForLocale(locale, {
          english: currentQuestion.englishTranslation,
          burmese: currentQuestion.burmeseTranslation,
        })
      : { english: null, burmese: null };
  const allSkipped =
    displayPhase === "done" &&
    displayAnswers.length > 0 &&
    displayAnswers.every((answer) => answer.status === "skipped");
  const usefulnessView =
    sessionKind === "guest" || sessionId === null
      ? null
      : buildUsefulnessView({
          formEnabled,
          sessionId,
        });
  const { open: usefulnessOpen, openNow: openUsefulness, close: closeUsefulness } =
    useUsefulnessNudge(Boolean(usefulnessView && revealDone));
  const askForFullSession =
    sessionKind === "guest" &&
    fullSessionChecked &&
    !fullSessionSent &&
    displayPhase === "done" &&
    Boolean(report) &&
    !allSkipped;
  const {
    open: requestOpen,
    openNow: openRequest,
    close: closeRequest,
  } = useUsefulnessNudge(Boolean(askForFullSession && revealDone));
  const requestDialogStep =
    fullSessionStep === "saved"
      ? "saved"
      : requestOpen || fullSessionStep === "form"
        ? "form"
        : null;
  const classroomLocked = displayPhase !== "done";
  return (
    <div
      data-testid="call-screen"
      className={
        classroomLocked
          ? "flex h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] p-3 text-eel md:p-4"
          : "min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] p-4 text-eel md:p-6"
      }
    >
      <div
        className={
          classroomLocked
            ? "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col items-center gap-3"
            : "mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col items-center gap-5 md:min-h-[calc(100vh-3rem)] md:gap-6"
        }
      >
        <div className="flex w-full shrink-0 items-center justify-end gap-3">
          {SHOW_SKIP_INTERVIEW && !previewing && phase !== "done" ? (
            <button
              type="button"
              onClick={() => {
                setPreviewReport(getSampleReport(null));
                setFormEnabled(true);
              }}
              className="text-xs text-eel/40 underline-offset-2 hover:text-eel/70 hover:underline"
            >
              {copy.call.skipInterview}
            </button>
          ) : null}
          <LanguageToggle locale={locale} onChange={setLocale} />
        </div>
        {participantId ? (
          <p className="w-full text-center text-sm text-eel/70">
            {copy.call.participant} {participantId}
          </p>
        ) : null}
        {pushbackVisible && !previewing ? (
          <TryAgainBanner locale={locale} />
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
          ) : displayPhase === "done" && showScoringUnavailable ? (
            <ScoringUnavailableScreen />
          ) : displayPhase === "done" && report ? (
            <InterviewReportScreen
              view={buildReportView({
                report,
                locale,
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
              onRequestFullSession={
                askForFullSession
                  ? () => {
                      setFullSessionStep("form");
                      openRequest();
                    }
                  : undefined
              }
              locale={locale}
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
                      english={helperLines.english}
                      burmese={helperLines.burmese}
                      onHearAgain={
                        studentTurn === "idle" || speakPaused
                          ? handleHearAgain
                          : undefined
                      }
                      hearAgainPlaying={hearAgainPlaying}
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

        {requestDialogStep ? (
          <FullSessionRequestDialog
            step={requestDialogStep}
            onClose={() => {
              setFullSessionStep(null);
              closeRequest();
            }}
            onSent={() => {
              setFullSessionSent(true);
              setFullSessionStep("saved");
              closeRequest();
            }}
          />
        ) : null}

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
            locale={locale}
            onFinished={(outcome) => {
              closeUsefulness();
              if (outcome === "submitted") setUsefulnessSubmitted(true);
            }}
          />
        ) : null}

        {displayPhase === "done" || studentTurn === "none" ? null : (
          <div
            data-testid="answer-dock"
            className="flex w-full max-w-xl shrink-0 flex-col items-center gap-3 rounded-2xl border border-eel/10 bg-white/90 px-5 py-3"
          >
          {studentTurn === "speak" ? (
            <div
              data-testid="live-transcript"
              className="w-full rounded-2xl border border-eel/10 bg-eel/5 px-4 py-3 text-center"
            >
              <p className="text-xs font-medium tracking-wide text-eel/60">
                {copy.call.liveTranscript}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-eel">
                {liveCaption ??
                  (speakPaused ? copy.call.paused : copy.call.listening)}
              </p>
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <div className="flex min-w-[5.5rem] items-center justify-end">
                {canAnswerAgain ? (
                  <button
                    type="button"
                    onClick={handleAnswerAgain}
                    aria-label={copy.call.answerAgain}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-eel/70 transition-colors hover:bg-eel/10 hover:text-eel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eel"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 12a9 9 0 1 0 3-6.7" />
                      <path d="M3 4v5h5" />
                    </svg>
                    {copy.call.answerAgain}
                  </button>
                ) : null}
              </div>
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
                  onClick={handleToggleSpeakPause}
                />
              ) : null}
              <div className="min-w-[5.5rem]" aria-hidden="true" />
            </div>
            {studentTurn === "speak" ? (
              <button
                type="button"
                onClick={onSubmitClick}
                disabled={submitPending}
                className="rounded-full bg-feather px-6 py-3 font-medium text-white transition-colors hover:bg-feather-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {copy.call.submitAnswer}
              </button>
            ) : null}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
