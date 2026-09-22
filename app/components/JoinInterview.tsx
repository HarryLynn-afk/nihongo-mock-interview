"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { useLobbyDevices } from "../call/useLobbyDevices";
import { readFullSessionRequestSent } from "@/lib/content/fullSessionRequest";
import { saveDevicePrefs } from "./devicePrefs";
import {
  FullSessionRequestDialog,
  type FullSessionRequestStep,
} from "./FullSessionRequestDialog";
import { useCopy } from "./useUiLocale";

type JoinInterviewProps = {
  label?: string;
  className?: string;
  /** Guest Join from `/` — `/call` must not reuse a leftover Participant session. */
  guest?: boolean;
  tone?: "indigo" | "feather";
  trailing?: ReactNode;
};

/**
 * Practice Join CTA. Guest (`guest`) asks how to practice, then `/guest`.
 * A consented Participant opens the device lobby on this page, then `/call`.
 */
export function JoinInterview({
  label,
  className = "",
  guest = false,
  tone = "indigo",
  trailing,
}: JoinInterviewProps) {
  const router = useRouter();
  const { copy } = useCopy();
  const buttonLabel = label ?? copy.join.joinInterview;
  const [requestStep, setRequestStep] = useState<FullSessionRequestStep | null>(
    null,
  );

  const {
    devicesVisible,
    reminderVisible,
    interviewStarted,
    secondsLeft,
    openDevices,
    continueFromDevices,
    skipReminder,
  } = useInterviewLobby({ skipLobby: false, startIdle: true });

  const {
    cameraOn,
    micOn,
    cameraBlocked,
    cameraErrorName,
    micBlocked,
    micErrorName,
    videoRef,
    toggleCamera,
    toggleMic,
  } = useLobbyDevices({
    active: devicesVisible && !interviewStarted,
  });

  useEffect(() => {
    if (!interviewStarted) return;
    saveDevicePrefs({ cameraOn, micOn });
    router.push(guest ? "/call?guest=1" : "/call");
  }, [interviewStarted, cameraOn, micOn, guest, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (guest) setRequestStep("choice");
          else openDevices();
        }}
        className={`inline-flex items-center justify-center gap-2.5 rounded-full px-5 text-lg font-medium ${
          tone === "feather"
            ? "min-h-[60px] w-auto px-8 bg-feather py-3 text-white shadow-[0_14px_30px_-10px_rgba(88,204,2,0.55)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-feather-dark hover:shadow-[0_18px_34px_-10px_rgba(88,204,2,0.65)]"
            : "h-[60px] w-full bg-indigo text-paper shadow-[0_4px_7px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#4338ca]"
        } ${className}`.trim()}
      >
        {buttonLabel}
        {trailing}
      </button>

      {requestStep ? (
        <FullSessionRequestDialog
          step={requestStep}
          showContinue
          onClose={() => setRequestStep(null)}
          onContinueAsGuest={() => {
            setRequestStep(null);
            if (guest) {
              router.push("/guest");
              return;
            }
            openDevices();
          }}
          onLeaveEmail={() => {
            setRequestStep(
              readFullSessionRequestSent() ? "alreadySent" : "form",
            );
          }}
          onSent={() => setRequestStep("saved")}
        />
      ) : null}
      {devicesVisible ? (
        <div
          role="dialog"
          aria-label={copy.lobby.readyToJoin}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#e8f8d4]/80 p-6"
        >
          <InterviewLobby
            cameraEnabled={cameraOn}
            micEnabled={micOn}
            cameraBlocked={cameraBlocked}
            cameraErrorName={cameraErrorName}
            micBlocked={micBlocked}
            micErrorName={micErrorName}
            videoRef={videoRef}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            onContinue={continueFromDevices}
          />
        </div>
      ) : null}
      {reminderVisible ? (
        <InterviewStartReminder
          secondsLeft={secondsLeft}
          onSkip={skipReminder}
        />
      ) : null}
    </>
  );
}
