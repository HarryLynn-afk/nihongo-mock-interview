import { useCallback, useEffect, useRef, useState } from "react";
import type { RefCallback } from "react";
import { openNavigatorCamera } from "./openUserCamera";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

/** DOMException is not always an `instanceof Error`, so read `name` directly. */
function deviceErrorName(error: unknown): string {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" && name ? name : "UnknownError";
}

type MicrophonePermissionState = "granted" | "denied" | "prompt" | "unknown";

async function queryMicrophoneState(): Promise<MicrophonePermissionState> {
  const permissions = (
    navigator as Navigator & {
      permissions?: {
        query: (descriptor: { name: string }) => Promise<{ state: string }>;
      };
    }
  ).permissions;
  if (!permissions?.query) return "unknown";
  try {
    const status = await permissions.query({ name: "microphone" });
    if (
      status.state === "denied" ||
      status.state === "granted" ||
      status.state === "prompt"
    ) {
      return status.state;
    }
  } catch {
    /* Safari can throw for this query */
  }
  return "unknown";
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
  try {
    const playing = video.play();
    if (playing && typeof playing.catch === "function") {
      void playing.catch(() => {});
    }
  } catch {
    /* jsdom does not implement play() */
  }
}

/**
 * Lobby device preview. Camera and microphone are requested only from
 * their own toggle clicks — getUserMedia must start in that click so
 * Safari will show a permission popup.
 */
export function useLobbyDevices({ active }: { active: boolean }) {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cameraErrorName, setCameraErrorName] = useState<string | null>(null);
  const [micBlocked, setMicBlocked] = useState(false);
  const [micErrorName, setMicErrorName] = useState<string | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const cameraOnRef = useRef(false);
  const micOnRef = useRef(false);
  const micBlockedRef = useRef(false);

  const attachPreview = useCallback((stream: MediaStream | null) => {
    const video = videoElRef.current;
    if (!video) return;
    playPreview(video, stream);
  }, []);

  const videoRef: RefCallback<HTMLVideoElement> = useCallback(
    (node) => {
      videoElRef.current = node;
      if (node && videoStreamRef.current) {
        playPreview(node, videoStreamRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    micBlockedRef.current = micBlocked;
  }, [micBlocked]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    async function refreshMicrophonePermission() {
      const state = await queryMicrophoneState();
      if (cancelled) return;
      if (state === "denied") {
        setMicBlocked(true);
        if (micOnRef.current) setMicOn(false);
        return;
      }
      if (micBlockedRef.current && state !== "unknown") {
        setMicBlocked(false);
      }
    }

    function onFocus() {
      void refreshMicrophonePermission();
    }

    void refreshMicrophonePermission();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [active]);

  useEffect(() => {
    if (active) {
      return () => {
        stopStream(videoStreamRef.current);
        stopStream(audioStreamRef.current);
        videoStreamRef.current = null;
        audioStreamRef.current = null;
      };
    }
    stopStream(videoStreamRef.current);
    stopStream(audioStreamRef.current);
    videoStreamRef.current = null;
    audioStreamRef.current = null;
    cameraOnRef.current = false;
    micOnRef.current = false;
    attachPreview(null);
  }, [active, attachPreview]);

  const resetDevices = useCallback(() => {
    stopStream(videoStreamRef.current);
    stopStream(audioStreamRef.current);
    videoStreamRef.current = null;
    audioStreamRef.current = null;
    cameraOnRef.current = false;
    micOnRef.current = false;
    setCameraOn(false);
    setMicOn(false);
    setCameraBlocked(false);
    setCameraErrorName(null);
    setMicBlocked(false);
    setMicErrorName(null);
    attachPreview(null);
  }, [attachPreview]);

  const toggleCamera = useCallback(() => {
    if (cameraOnRef.current) {
      cameraOnRef.current = false;
      setCameraOn(false);
      stopStream(videoStreamRef.current);
      videoStreamRef.current = null;
      attachPreview(null);
      return;
    }

    cameraOnRef.current = true;
    setCameraBlocked(false);
    setCameraErrorName(null);
    setCameraOn(true);

    void openNavigatorCamera().then((result) => {
      if (!cameraOnRef.current) {
        if ("stream" in result) stopStream(result.stream);
        return;
      }
      if ("stream" in result) {
        stopStream(videoStreamRef.current);
        videoStreamRef.current = result.stream;
        attachPreview(result.stream);
        return;
      }
      cameraOnRef.current = false;
      stopStream(videoStreamRef.current);
      videoStreamRef.current = null;
      setCameraBlocked(true);
      setCameraErrorName(result.errorName);
      setCameraOn(false);
      if (typeof console !== "undefined" && "debug" in console) {
        console.debug("Camera open failed", result.errorName);
      }
      attachPreview(null);
    });
  }, [attachPreview]);

  const toggleMic = useCallback(() => {
    if (micOnRef.current) {
      micOnRef.current = false;
      setMicOn(false);
      stopStream(audioStreamRef.current);
      audioStreamRef.current = null;
      return;
    }

    micOnRef.current = true;
    setMicBlocked(false);
    setMicErrorName(null);
    setMicOn(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicErrorName("NotSupportedError");
      setMicOn(false);
      micOnRef.current = false;
      return;
    }

    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!micOnRef.current) {
          stopStream(stream);
          return;
        }
        stopStream(audioStreamRef.current);
        audioStreamRef.current = stream;
        setMicBlocked(false);
        setMicErrorName(null);
      })
      .catch(async (error: unknown) => {
        micOnRef.current = false;
        stopStream(audioStreamRef.current);
        audioStreamRef.current = null;
        setMicOn(false);
        setMicErrorName(deviceErrorName(error));
        const state = await queryMicrophoneState();
        if (state === "denied") setMicBlocked(true);
      });
  }, []);

  return {
    cameraOn,
    micOn,
    cameraBlocked,
    cameraErrorName,
    micBlocked,
    micErrorName,
    videoRef,
    toggleCamera,
    toggleMic,
    resetDevices,
  };
}
