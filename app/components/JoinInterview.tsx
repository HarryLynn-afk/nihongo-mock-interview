"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/content/studyAuth";
import { fillTemplate } from "@/lib/content/uiCopy";
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
  consentRequired?: boolean;
  tone?: "indigo" | "feather";
  trailing?: ReactNode;
};

/**
 * Practice Join CTA. Both modes open the device lobby inline as a dialog.
 * A consented Participant opens on this page, then `/call`; a Guest opens
 * the same lobby, then `/call?guest=1`.
 */
export function JoinInterview({
  label,
  className = "",
  guest = false,
  consentRequired = false,
  tone = "indigo",
  trailing,
}: JoinInterviewProps) {
  const router = useRouter();
  const { copy } = useCopy();
  const buttonLabel = label ?? copy.join.joinInterview;
  const [needsConsent, setNeedsConsent] = useState(consentRequired);
  const [consentVisible, setConsentVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [consentPending, setConsentPending] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  async function submitConsent() {
    if (!agreed || consentPending) return;
    setConsentPending(true);
    setConsentError(null);
    try {
      const response = await fetch("/api/study/consent", { method: "POST" });
      const result = (await response.json()) as { participantId?: string; error?: string };
      if (!response.ok || !result.participantId) {
        setConsentError(
          response.status === 401
            ? copy.consent.errorSignedOut
            : result.error === "join_full"
              ? copy.joinLink.full
              : result.error === "not_invited"
                ? copy.consent.errorNotInvited
                : copy.consent.errorSave,
        );
        return;
      }
      setNeedsConsent(false);
      setConsentVisible(false);
      openDevices();
    } catch {
      setConsentError(copy.consent.errorSave);
    } finally {
      setConsentPending(false);
    }
  }

  const {
    devicesVisible,
    reminderVisible,
    interviewStarted,
    secondsLeft,
    openDevices,
    closeDevices,
    continueFromDevices,
    skipReminder,
    cancelReminder,
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
    resetDevices,
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
          if (needsConsent) setConsentVisible(true);
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

      {consentVisible ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-consent-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-eel/35 p-5"
        >
          <div className="relative w-full max-w-[520px] rounded-[24px] bg-white p-6 text-left text-eel shadow-[0_24px_64px_-20px_rgba(28,71,46,0.35)] md:p-8">
            <button
              type="button"
              aria-label={copy.lobby.close}
              onClick={() => setConsentVisible(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full hover:bg-eel/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
            <h2 id="join-consent-title" className="pr-8 text-2xl font-semibold">
              {copy.consent.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-wolf">
              {fillTemplate(copy.consent.body, { version: CONSENT_VERSION })}
            </p>
            <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-1 size-4 accent-feather"
              />
              {copy.consent.checkbox}
            </label>
            {consentError ? <p role="alert" className="mt-4 text-sm text-red-700">{consentError}</p> : null}
            <button
              type="button"
              disabled={!agreed || consentPending}
              onClick={() => void submitConsent()}
              className="mt-6 min-h-[52px] w-full rounded-full bg-feather px-6 py-3 font-medium text-white hover:bg-feather-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather disabled:opacity-60"
            >
              {copy.consent.agree}
            </button>
          </div>
        </div>
      ) : null}

      {devicesVisible ? (
        <div
          role="dialog"
          aria-label={copy.lobby.readyToJoin}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#e8f8d4]/80 p-6"
        >
          <div className="relative w-full max-w-[360px]">
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
            <button
              type="button"
              aria-label={copy.lobby.close}
              onClick={() => {
                resetDevices();
                closeDevices();
              }}
              className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-white/90 text-eel shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="size-4"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      {reminderVisible ? (
        <InterviewStartReminder
          secondsLeft={secondsLeft}
          onSkip={skipReminder}
          onCancel={cancelReminder}
        />
      ) : null}
    </>
  );
}
