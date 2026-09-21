import Image from "next/image";
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
  const cameraStatus =
    cameraEnabled && !cameraBlocked
      ? copy.lobby.cameraReady
      : cameraEnabled && cameraBlocked
        ? copy.lobby.cameraBlocked
        : copy.lobby.cameraOff;
  const micStatus = micBlocked
    ? copy.lobby.micBlocked
    : micEnabled
      ? copy.lobby.micReady
      : copy.lobby.micOff;

  return (
    <div
      role="dialog"
      aria-label={copy.lobby.readyToJoin}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink p-6 text-paper"
    >
      <div className="flex w-full max-w-3xl flex-col gap-8 md:flex-row md:items-center">
        <div
          data-testid="classroom-preview"
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink md:max-w-sm"
        >
          {showCameraPreview ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src="/tanaka-sensei.png"
              alt=""
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
              className="object-cover"
              priority
            />
          )}
          <p className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs text-paper">
            {copy.lobby.camera} {cameraStatus} · {copy.lobby.mic} {micStatus}
          </p>
        </div>

        <div className="flex w-full flex-col text-left">
          <h2 className="text-2xl font-medium">{copy.lobby.heading}</h2>
          <p className="mt-2 text-paper/80">{copy.lobby.subhead}</p>

          <div className="mt-6 flex flex-col gap-3">
            {/* Click, not change: Safari only shows a camera/mic popup if
                getUserMedia starts in the same click as the checkbox. */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={cameraEnabled}
                onChange={() => {}}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCamera();
                }}
              />
              {copy.lobby.camera}
            </label>
            <p className="-mt-1 ml-7 text-sm text-paper/60">
              {copy.lobby.cameraOptional}
            </p>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={micEnabled}
                onChange={() => {}}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMic();
                }}
              />
              {copy.lobby.microphone}
            </label>
          </div>

          {cameraHelp ? (
            <div
              data-testid="camera-blocked-help"
              className={
                cameraHelpIsQuiet
                  ? "mt-3 rounded-lg border border-paper/15 bg-paper/5 px-3 py-2 text-sm text-paper/80"
                  : "mt-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
              }
            >
              <p className="font-medium">{cameraHelp.title}</p>
              <p
                className={
                  cameraHelpIsQuiet ? "mt-1 text-paper/70" : "mt-1 text-amber-100/90"
                }
              >
                {cameraHelp.steps}
              </p>
              <p
                className={
                  cameraHelpIsQuiet ? "mt-1 text-paper/60" : "mt-1 text-amber-100/80"
                }
              >
                {cameraHelp.after}
              </p>
            </div>
          ) : null}

          {help ? (
            <div
              data-testid="mic-blocked-help"
              className="mt-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
            >
              <p className="font-medium">{help.title}</p>
              <p className="mt-1 text-amber-100/90">{help.steps}</p>
              <p className="mt-1 text-amber-100/80">{help.after}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onContinue}
            className="mt-8 w-full rounded-full bg-indigo px-6 py-3 font-medium text-paper"
          >
            {copy.lobby.enterClassroom}
          </button>
        </div>
      </div>
    </div>
  );
}
