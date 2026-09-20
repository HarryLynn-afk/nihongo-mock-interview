import { useEffect, useRef, useState } from "react";

/**
 * Mic on/off control for the call screen's student tile. Checking
 * "Mic on" requests real microphone permission via `getUserMedia`, the
 * same way `useCameraStream` does for the camera tile — this used to be
 * UI-only state with no prompt at all. The stream held here is only for
 * the permission prompt / tile indicator; Speak's own capture
 * (`useAnswerCapture`) opens its own independent `getUserMedia` stream
 * once permission is already granted, so this never blocks Speak.
 */
export function useMicToggle({
  initialOn = true,
}: { initialOn?: boolean } = {}) {
  const [micOn, setMicOn] = useState(initialOn);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setMicOn(initialOn);
  }, [initialOn]);

  useEffect(() => {
    if (!micOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) return;

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
      })
      .catch(() => {
        if (!cancelled) setMicOn(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [micOn]);

  function toggleMic() {
    setMicOn((current) => !current);
  }

  return { micOn, toggleMic };
}
