"use client";

import { SenseiTile } from "./SenseiTile";
import { StudentTile } from "./StudentTile";
import { useCameraStream } from "./useCameraStream";
import { useMicToggle } from "./useMicToggle";

export default function CallPage() {
  const { cameraState, toggleCamera, videoRef } = useCameraStream();
  const { micOn, toggleMic } = useMicToggle();

  return (
    <div
      data-testid="call-screen"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink p-6 md:flex-row"
    >
      <div className="w-full max-w-md">
        <StudentTile
          cameraState={cameraState}
          micOn={micOn}
          videoRef={videoRef}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
        />
      </div>
      <div className="w-full max-w-md">
        <SenseiTile />
      </div>
    </div>
  );
}
