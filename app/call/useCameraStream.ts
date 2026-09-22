import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";
import { openNavigatorCamera } from "./openUserCamera";

export type CameraState = "on" | "off" | "blocked";

/**
 * Resolves camera permission into exactly one of three states and wires
 * the resulting stream to whatever <video> element the caller attaches
 * via videoRef. Never throws or exposes the getUserMedia promise/
 * rejection to the caller — "denied" is a valid resolved state, not an
 * error to handle.
 *
 * StudentTile unmounts <video> while Camera is off, so videoRef is a
 * callback: a remount must reattach the live stream and call play(),
 * otherwise the tile stays black with the camera LED still on.
 */
function stopStream(stream: MediaStream | null) {
  stream?.getTracks?.().forEach((track) => track.stop());
}

function playPreview(video: HTMLVideoElement, stream: MediaStream | null) {
  video.srcObject = stream;
  video.muted = true;
  try {
    video.playsInline = true;
  } catch {
    /* ignore */
  }
  if (!stream || typeof video.play !== "function") return;
  const start = () => {
    try {
      const playing = video.play();
      if (playing && typeof playing.catch === "function") {
        void playing.catch(() => {});
      }
    } catch {
      /* jsdom does not implement play() */
    }
  };
  start();
  video.onloadedmetadata = start;
}

export function useCameraStream({ startOn = true }: { startOn?: boolean } = {}) {
  const [cameraState, setCameraState] = useState<CameraState>(
    startOn ? "on" : "off",
  );
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCameraState(startOn ? "on" : "off");
  }, [startOn]);

  const videoRef: RefCallback<HTMLVideoElement> = useCallback((node) => {
    videoElRef.current = node;
    if (node && streamRef.current) {
      playPreview(node, streamRef.current);
    }
  }, []);

  useEffect(() => {
    if (cameraState === "off") {
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoElRef.current) playPreview(videoElRef.current, null);
      return;
    }
    if (cameraState === "blocked") return;

    let cancelled = false;

    void openNavigatorCamera().then((result) => {
      if (cancelled) {
        if ("stream" in result) stopStream(result.stream);
        return;
      }
      if ("stream" in result) {
        stopStream(streamRef.current);
        streamRef.current = result.stream;
        if (videoElRef.current) playPreview(videoElRef.current, result.stream);
        setCameraState("on");
        return;
      }
      setCameraState("blocked");
    });

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoElRef.current) playPreview(videoElRef.current, null);
    };
  }, [cameraState]);

  function toggleCamera() {
    setCameraState((current) => (current === "off" ? "on" : "off"));
  }

  return { cameraState, toggleCamera, videoRef };
}
