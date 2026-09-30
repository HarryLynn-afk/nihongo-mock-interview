import type { Ref } from "react";
import { useCopy } from "../components/useUiLocale";
import { MicLevelMeter } from "./MicLevelMeter";
import {
  cameraTroubleCopy,
  classifyDeviceError,
  detectBrowserFamily,
  insecurePageCopy,
  micBlockedHelpCopy,
} from "./micBlockedHelp";

type InterviewLobbyProps = {
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraBlocked: boolean;
  cameraErrorName?: string | null;
  micBlocked?: boolean;
  micErrorName?: string | null;
  videoRef: Ref<HTMLVideoElement | null>;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onContinue: () => void;
  micStream?: MediaStream | null;
};

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 11a7 7 0 01-14 0M12 18v3" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </svg>
  );
}

export function InterviewLobby({
  cameraEnabled,
  micEnabled,
  cameraBlocked,
  cameraErrorName = null,
  micBlocked = false,
  micErrorName = null,
  videoRef,
  onToggleCamera,
  onToggleMic,
  onContinue,
  micStream = null,
}: InterviewLobbyProps) {
  const { copy } = useCopy();
  const showCameraPreview = cameraEnabled && !cameraBlocked;
  const micActive = micEnabled && !micBlocked;
  const browserFamily = detectBrowserFamily(
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  );
  const pageCannotUseDevices =
    classifyDeviceError(cameraErrorName ?? micErrorName ?? "") === "insecure";
  const help = pageCannotUseDevices
    ? insecurePageCopy()
    : micBlocked
      ? micBlockedHelpCopy(browserFamily)
      : null;
  const cameraKind =
    cameraBlocked && !pageCannotUseDevices
      ? classifyDeviceError(cameraErrorName ?? "")
      : null;
  const cameraHelp = cameraKind
    ? cameraKind === "missing" || cameraKind === "unknown"
      ? copy.cameraMiss
      : cameraTroubleCopy(cameraKind, browserFamily)
    : null;
  const cameraHelpIsQuiet =
    cameraKind === "missing" || cameraKind === "unknown";
  const avatarLetter =
    copy.call.you.trim().charAt(0).toLocaleUpperCase() || "Y";

  return (
    <div className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-feather/15 bg-white text-eel shadow-[0_24px_64px_-20px_rgba(88,204,2,0.28)]">
      <div
        data-testid="classroom-preview"
        className="relative aspect-[4/3] w-full bg-[linear-gradient(180deg,#e8f8d4_0%,#f4fbef_100%)]"
      >
        {showCameraPreview ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feather text-3xl font-semibold text-white"
            >
              {avatarLetter}
            </div>
          </div>
        )}

        {/* Click, not change: Safari only shows a camera/mic popup if
            getUserMedia starts in the same click as the control. */}
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
          <div className="flex overflow-hidden rounded-full border border-feather/20 bg-white/90 shadow-[0_8px_20px_-8px_rgba(20,30,20,0.2)]">
            <button
              type="button"
              aria-pressed={micActive}
              aria-label={copy.lobby.microphone}
              onClick={onToggleMic}
              className="relative flex min-w-[84px] flex-col items-center gap-1 px-4 py-2 text-eel transition hover:bg-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
            >
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                <MicIcon className="h-5 w-5" />
                {!micActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rotate-45 rounded-sm bg-[#e2245b]"
                  />
                ) : null}
              </span>
              <span className="text-xs font-medium">
                {copy.lobby.microphone}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={showCameraPreview}
              aria-label={copy.lobby.camera}
              onClick={onToggleCamera}
              className="relative flex min-w-[84px] flex-col items-center gap-1 border-l border-feather/20 px-4 py-2 text-eel transition hover:bg-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
            >
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                <CameraIcon className="h-5 w-5" />
                {!showCameraPreview ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rotate-45 rounded-sm bg-[#e2245b]"
                  />
                ) : null}
              </span>
              <span className="text-xs font-medium">{copy.lobby.camera}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <MicLevelMeter stream={micStream} />
        <p className="text-center text-xs text-wolf">
          {copy.lobby.cameraOptional}
        </p>

        {cameraHelp ? (
          <div
            data-testid="camera-blocked-help"
            className={
              cameraHelpIsQuiet
                ? "rounded-xl border border-feather/15 bg-polar px-3 py-2 text-sm text-eel"
                : "rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-eel"
            }
          >
            <p className="font-medium">{cameraHelp.title}</p>
            <p className="mt-1 text-wolf">{cameraHelp.steps}</p>
            <p className="mt-1 text-wolf">{cameraHelp.after}</p>
          </div>
        ) : null}

        {help ? (
          <div
            data-testid="mic-blocked-help"
            className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-eel"
          >
            <p className="font-medium">{help.title}</p>
            <p className="mt-1 text-wolf">{help.steps}</p>
            <p className="mt-1 text-wolf">{help.after}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-feather px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(88,204,2,0.55)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-feather-dark hover:shadow-[0_18px_34px_-10px_rgba(88,204,2,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feather"
        >
          {copy.lobby.enterClassroom}
        </button>
      </div>
    </div>
  );
}
