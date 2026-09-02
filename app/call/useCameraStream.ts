import { useEffect, useRef, useState } from "react";

export type CameraState = "on" | "off" | "blocked";

/**
 * Resolves camera permission into exactly one of three states and wires
 * the resulting stream to whatever <video> element the caller attaches
 * via videoRef. Never throws or exposes the getUserMedia promise/
 * rejection to the caller — "denied" is a valid resolved state, not an
 * error to handle.
 */
export function useCameraStream({ startOn = true }: { startOn?: boolean } = {}) {
  const [cameraState, setCameraState] = useState<CameraState>(
    startOn ? "on" : "off",
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!startOn) {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraState("off");
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraState("on");
      })
      .catch(() => {
        if (!cancelled) setCameraState("blocked");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [startOn]);

  function toggleCamera() {
    setCameraState((current) => (current === "off" ? "on" : "off"));
  }

  return { cameraState, toggleCamera, videoRef };
}
