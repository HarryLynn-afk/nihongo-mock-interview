import Image from "next/image";
import type { RefObject } from "react";

type InterviewLobbyProps = {
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraBlocked: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onContinue: () => void;
};

export function InterviewLobby({
  cameraEnabled,
  micEnabled,
  cameraBlocked,
  videoRef,
  onToggleCamera,
  onToggleMic,
  onContinue,
}: InterviewLobbyProps) {
  const showCameraPreview = cameraEnabled && !cameraBlocked;
  return (
    <div
      role="dialog"
      aria-label="Ready to join"
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
            Camera{" "}
            {cameraBlocked
              ? "blocked"
              : cameraEnabled
                ? "ready"
                : "off"}{" "}
            · Mic {micEnabled ? "ready" : "off"}
          </p>
        </div>

        <div className="flex w-full flex-col text-left">
          <h2 className="text-2xl font-medium">
            Japanese interview with Tanaka-sensei
          </h2>
          <p className="mt-2 text-paper/80">
            Choose camera and microphone, then enter the classroom.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={cameraEnabled}
                onChange={onToggleCamera}
              />
              Camera
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={micEnabled}
                onChange={onToggleMic}
              />
              Microphone
            </label>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="mt-8 w-full rounded-full bg-indigo px-6 py-3 font-medium text-paper"
          >
            Enter classroom
          </button>
        </div>
      </div>
    </div>
  );
}
