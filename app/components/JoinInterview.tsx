"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { useLobbyDevices } from "../call/useLobbyDevices";
import { saveDevicePrefs } from "./devicePrefs";
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
 * Practice Join: device check → 15s popup on this page → `/call`.
 * Guest (`guest`) lands on `/call?guest=1`, the 3 locked Questions.
 * A consented Participant lands on `/call`, the topic bank.
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
  } = useLobbyDevices({ active: devicesVisible });

  useEffect(() => {
    if (!interviewStarted) return;
    saveDevicePrefs({ cameraOn, micOn });
    router.push(guest ? "/call?guest=1" : "/call");
  }, [interviewStarted, cameraOn, micOn, guest, router]);

  return (
    <>
      <button
        type="button"
        onClick={openDevices}
        className={`inline-flex items-center justify-center gap-2.5 rounded-full px-5 text-lg font-medium ${
          tone === "feather"
            ? "min-h-[60px] w-auto px-8 bg-feather py-3 text-white shadow-[0_14px_30px_-10px_rgba(88,204,2,0.55)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-feather-dark hover:shadow-[0_18px_34px_-10px_rgba(88,204,2,0.65)]"
            : "h-[60px] w-full bg-indigo text-paper shadow-[0_4px_7px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#4338ca]"
        } ${className}`.trim()}
      >
        {buttonLabel}
        {trailing}
      </button>

      {devicesVisible ? (
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
