import type { Ref } from "react";
import { useCopy } from "../components/useUiLocale";
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
    <div className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214] text-[#f2f2f3] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.55)]">
      <div
        data-testid="classroom-preview"
        className="relative aspect-[4/3] w-full bg-[#17181b]"
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
                className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#1f8f7a] text-3xl font-semibold text-white"
              >
                {avatarLetter}
              </div>
            </div>
          )}

          {/* Click, not change: Safari only shows a camera/mic popup if
              getUserMedia starts in the same click as the control. */}
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[rgba(20,21,24,0.92)]">
              <button
                type="button"
                aria-pressed={micActive}
                aria-label={copy.lobby.microphone}
                onClick={onToggleMic}
                className="relative flex min-w-[84px] flex-col items-center gap-1 px-4 py-2 text-[#f2f2f3] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]"
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
                className="relative flex min-w-[84px] flex-col items-center gap-1 border-l border-white/10 px-4 py-2 text-[#f2f2f3] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]"
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

        <div className="flex flex-col gap-3 px-4 py-3">
          <p className="text-center text-xs text-[#b8b9bd]">
            {copy.lobby.cameraOptional}
          </p>

          {cameraHelp ? (
            <div
              data-testid="camera-blocked-help"
              className={
                cameraHelpIsQuiet
                  ? "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f2f2f3]/80"
                  : "rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
              }
            >
              <p className="font-medium">{cameraHelp.title}</p>
              <p
                className={
                  cameraHelpIsQuiet
                    ? "mt-1 text-[#f2f2f3]/70"
                    : "mt-1 text-amber-100/90"
                }
              >
                {cameraHelp.steps}
              </p>
              <p
                className={
                  cameraHelpIsQuiet
                    ? "mt-1 text-[#f2f2f3]/60"
                    : "mt-1 text-amber-100/80"
                }
              >
                {cameraHelp.after}
              </p>
            </div>
          ) : null}

          {help ? (
            <div
              data-testid="mic-blocked-help"
              className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
            >
              <p className="font-medium">{help.title}</p>
              <p className="mt-1 text-amber-100/90">{help.steps}</p>
              <p className="mt-1 text-amber-100/80">{help.after}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-lg bg-[#1a73e8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2681ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]"
          >
            {copy.lobby.enterClassroom}
          </button>
        </div>
    </div>
  );
}
