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
  const [micErrorName, setMicErrorName] = useState<string | null>(null);
  const [prevInitialOn, setPrevInitialOn] = useState(initialOn);
  const streamRef = useRef<MediaStream | null>(null);

  if (initialOn !== prevInitialOn) {
    setPrevInitialOn(initialOn);
    setMicOn(initialOn);
  }

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
        setMicErrorName(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const name = (error as { name?: unknown } | null)?.name;
          setMicErrorName(typeof name === "string" && name ? name : "UnknownError");
          setMicOn(false);
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [micOn]);

  function toggleMic() {
    setMicErrorName(null);
    setMicOn((current) => !current);
  }

  return { micOn, toggleMic, micErrorName };
}
