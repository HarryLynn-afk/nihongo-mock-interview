import type { Ref } from "react";
import { useCopy } from "../components/useUiLocale";
import type { CameraState } from "./useCameraStream";

type StudentTileProps = {
  cameraState: CameraState;
  micOn: boolean;
  videoRef: Ref<HTMLVideoElement | null>;
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
    <div className="relative overflow-hidden rounded-xl border border-eel/20 bg-eel/5">
      <div className="relative aspect-[4/3] w-full bg-eel/5">
        {cameraVisible ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-eel/60">
            {copy.call.cameraOff}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-white/85 px-2 py-1.5">
          <p className="text-xs font-medium text-eel">{copy.call.you}</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onToggleCamera}
              aria-pressed={cameraState !== "off"}
              className="rounded-full bg-feather/15 px-2 py-0.5 text-[10px] text-eel"
            >
              {cameraState === "off" ? copy.call.cameraOff : copy.call.cameraOn}
            </button>
            <button
              type="button"
              onClick={onToggleMic}
              aria-pressed={micOn}
              className="rounded-full bg-feather/15 px-2 py-0.5 text-[10px] text-eel"
            >
              {micOn ? copy.call.micOn : copy.call.micOff}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
