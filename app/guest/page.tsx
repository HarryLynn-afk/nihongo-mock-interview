"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewLobby } from "../call/InterviewLobby";
import { InterviewStartReminder } from "../call/InterviewStartReminder";
import { useInterviewLobby } from "../call/useInterviewLobby";
import { useLobbyDevices } from "../call/useLobbyDevices";
import { LanguageToggle } from "../components/LanguageToggle";
import { saveDevicePrefs } from "../components/devicePrefs";
import { useCopy } from "../components/useUiLocale";

/**
 * Guest join screen: camera/mic preview is the page, then the 15s start
 * overlay, then `/call?guest=1`. Not a dialog over `/`.
 */
export default function GuestJoinPage() {
  const router = useRouter();
  const { locale, setLocale } = useCopy();
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
    <div className="relative min-h-dvh bg-[radial-gradient(circle_at_10%_55%,rgba(255,255,255,0.7),transparent_45%),linear-gradient(180deg,#e8f8d4_0%,#f4fbef_55%,#ffffff_100%)] text-eel">
      <header className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-5 py-6 md:px-12">
        <a
          href="/"
          className="font-display text-[1.5rem] font-bold tracking-tight text-feather"
        >
          NihonGo
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block -translate-y-2 text-base text-macaw"
          >
            ✦
          </span>
        </a>
        <div className="ml-auto">
          <LanguageToggle
            locale={locale}
            onChange={setLocale}
            variant="light"
            tone="feather"
          />
        </div>
      </header>
      <main className="flex min-h-[calc(100dvh-5.5rem)] items-center justify-center px-5 pb-10">
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
