import type { RefObject } from "react";
import type { CameraState } from "./useCameraStream";

type StudentTileProps = {
  cameraState: CameraState;
  micOn: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onToggleCamera: () => void;
  onToggleMic: () => void;
};

export function StudentTile({
  cameraState,
  micOn,
  videoRef,
  onToggleCamera,
  onToggleMic,
}: StudentTileProps) {
  const cameraVisible = cameraState === "on";

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-indigo/30 bg-ink">
      <div className="relative aspect-[4/3] w-full bg-ink">
        {cameraVisible ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-paper/60">
            Camera off
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-medium text-paper">You</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleCamera}
            aria-pressed={cameraState !== "off"}
            className="rounded-full bg-indigo/20 px-3 py-1 text-sm text-paper"
          >
            {cameraState === "off" ? "Camera off" : "Camera on"}
          </button>
          <button
            type="button"
            onClick={onToggleMic}
            aria-pressed={micOn}
            className="rounded-full bg-indigo/20 px-3 py-1 text-sm text-paper"
          >
            {micOn ? "Mic on" : "Mic off"}
          </button>
        </div>
      </div>
    </div>
  );
}
