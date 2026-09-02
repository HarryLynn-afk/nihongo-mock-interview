"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { useLobbyDevices } from "../call/useLobbyDevices";
import { saveDevicePrefs } from "./devicePrefs";

export function JoinInterview() {
  const router = useRouter();
  const isPitchMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("pitch") === "1";

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
    router.push(isPitchMode ? "/call?pitch=1" : "/call");
  }, [interviewStarted, cameraOn, micOn, isPitchMode, router]);

  function handleJoin() {
    if (isPitchMode) {
      router.push("/call?pitch=1");
      return;
    }
    openDevices();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleJoin}
        className="w-full rounded-full bg-indigo px-5 py-3 text-center font-medium text-paper transition-colors hover:bg-indigo/90"
      >
        Join interview
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
