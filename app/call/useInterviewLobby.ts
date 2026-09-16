import { useCallback, useEffect, useState } from "react";

const REMINDER_SECONDS = 15;

type LobbyStep = "idle" | "devices" | "reminder" | "started";

export function useInterviewLobby({
  skipLobby,
  startIdle = false,
}: {
  skipLobby: boolean;
  startIdle?: boolean;
}) {
  const [step, setStep] = useState<LobbyStep>(
    skipLobby ? "started" : startIdle ? "idle" : "devices",
  );
  const [secondsLeft, setSecondsLeft] = useState(REMINDER_SECONDS);

  const reminderRunning = step === "reminder" && secondsLeft > 0;
  const interviewStarted =
    step === "started" || (step === "reminder" && secondsLeft <= 0);

  useEffect(() => {
    if (!reminderRunning) return;

    const id = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [reminderRunning]);

  const openDevices = useCallback(() => {
    setStep("devices");
  }, []);

  const continueFromDevices = useCallback(() => {
    setSecondsLeft(REMINDER_SECONDS);
    setStep("reminder");
  }, []);

  const skipReminder = useCallback(() => {
    setSecondsLeft(0);
  }, []);

  return {
    devicesVisible: step === "devices",
    reminderVisible: step === "reminder",
    interviewStarted,
    secondsLeft,
    openDevices,
    continueFromDevices,
    skipReminder,
  };
}
