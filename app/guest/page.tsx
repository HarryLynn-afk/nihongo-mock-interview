"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { useLobbyDevices } from "../call/useLobbyDevices";
import { LanguageBar } from "../components/LanguageBar";
import { saveDevicePrefs } from "../components/devicePrefs";

/**
 * Guest join screen: camera/mic preview is the page, then the 15s start
 * overlay, then `/call?guest=1`. Not a dialog over `/`.
 */
export default function GuestJoinPage() {
  const router = useRouter();
  const {
    devicesVisible,
    reminderVisible,
    interviewStarted,
    secondsLeft,
    continueFromDevices,
    skipReminder,
  } = useInterviewLobby({ skipLobby: false });

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
    router.push("/call?guest=1");
  }, [interviewStarted, cameraOn, micOn, router]);

  return (
    <div className="relative min-h-dvh bg-black">
      <LanguageBar variant="dark" />
      <main className="flex min-h-dvh items-center justify-center p-6">
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
      </main>
      {reminderVisible ? (
        <InterviewStartReminder
          secondsLeft={secondsLeft}
          onSkip={skipReminder}
        />
      ) : null}
    </div>
  );
}
