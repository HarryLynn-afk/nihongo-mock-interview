import { useCallback, useEffect, useRef, useState } from "react";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useLobbyDevices({ active }: { active: boolean }) {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      stopStream(videoStreamRef.current);
      videoStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      stopStream(audioStreamRef.current);
      audioStreamRef.current = null;
      return;
    }

    if (!cameraOn) {
      stopStream(videoStreamRef.current);
      videoStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) return;

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) {
          stopStream(stream);
          return;
        }
        stopStream(videoStreamRef.current);
        videoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraBlocked(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCameraBlocked(true);
          setCameraOn(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [active, cameraOn]);

  useEffect(() => {
    if (!active) return;

    if (!micOn) {
      stopStream(audioStreamRef.current);
      audioStreamRef.current = null;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) return;

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stopStream(stream);
          return;
        }
        stopStream(audioStreamRef.current);
        audioStreamRef.current = stream;
      })
      .catch(() => {
        if (!cancelled) setMicOn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, micOn]);

  const toggleCamera = useCallback(() => {
    setCameraOn((current) => {
      if (current) return false;
      setCameraBlocked(false);
      return true;
    });
  }, []);

  const toggleMic = useCallback(() => {
    setMicOn((current) => !current);
  }, []);

  return {
    cameraOn,
    micOn,
    cameraBlocked,
    videoRef,
    toggleCamera,
    toggleMic,
  };
}
