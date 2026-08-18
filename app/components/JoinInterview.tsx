"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { saveDevicePrefs } from "./devicePrefs";

export function JoinInterview() {
  const router = useRouter();
  const isPitchMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("pitch") === "1";

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const {
    devicesVisible,
    reminderVisible,
    interviewStarted,
    secondsLeft,
    openDevices,
    continueFromDevices,
    skipReminder,
  } = useInterviewLobby({ skipLobby: false, startIdle: true });

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
          cameraBlocked={false}
          onToggleCamera={() => setCameraOn((current) => !current)}
          onToggleMic={() => setMicOn((current) => !current)}
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
