"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { useLobbyDevices } from "../call/useLobbyDevices";
import { saveDevicePrefs } from "./devicePrefs";

type JoinInterviewProps = {
  label?: string;
  className?: string;
};

/**
 * Practice-mode Join: device check → 15s reminder → `/call`.
 * Pitch mode has its own entry point at `/pitch` and never goes through
 * this lobby (see `app/pitch/page.tsx`).
 */
export function JoinInterview({
  label = "Join interview",
  className = "",
}: JoinInterviewProps) {
  const router = useRouter();

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
    videoRef,
    toggleCamera,
    toggleMic,
  } = useLobbyDevices({ active: devicesVisible });

  useEffect(() => {
    if (!interviewStarted) return;
    saveDevicePrefs({ cameraOn, micOn });
    router.push("/call");
  }, [interviewStarted, cameraOn, micOn, router]);

  return (
    <>
      <button
        type="button"
        onClick={openDevices}
        className={`inline-flex h-[60px] w-full items-center justify-center rounded-full bg-indigo px-5 text-lg font-medium text-paper shadow-[0_4px_7px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#4338ca] ${className}`.trim()}
      >
        {label}
      </button>

      {devicesVisible ? (
        <InterviewLobby
          cameraEnabled={cameraOn}
          micEnabled={micOn}
          cameraBlocked={cameraBlocked}
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
