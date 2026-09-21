import type { RefObject } from "react";
import { useCopy } from "../components/useUiLocale";
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
  const { copy } = useCopy();
  const cameraVisible = cameraState === "on";

  return (
    <div className="relative overflow-hidden rounded-xl border border-paper/20 bg-ink">
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
          <div className="flex h-full w-full items-center justify-center text-xs text-paper/60">
            {copy.call.cameraOff}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/80 px-2 py-1.5">
          <p className="text-xs font-medium text-paper">{copy.call.you}</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onToggleCamera}
              aria-pressed={cameraState !== "off"}
              className="rounded-full bg-indigo/20 px-2 py-0.5 text-[10px] text-paper"
            >
              {cameraState === "off" ? copy.call.cameraOff : copy.call.cameraOn}
            </button>
            <button
              type="button"
              onClick={onToggleMic}
              aria-pressed={micOn}
              className="rounded-full bg-indigo/20 px-2 py-0.5 text-[10px] text-paper"
            >
              {micOn ? copy.call.micOn : copy.call.micOff}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
