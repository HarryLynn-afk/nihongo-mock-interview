import { useEffect, useState } from "react";

/**
 * Pure UI toggle state for the mic on/off control. Real audio capture
 * is Issue 7's concern — this hook only tracks the user's on/off intent.
 */
export function useMicToggle({ initialOn = true }: { initialOn?: boolean } = {}) {
  const [micOn, setMicOn] = useState(initialOn);

  useEffect(() => {
    setMicOn(initialOn);
  }, [initialOn]);

  function toggleMic() {
    setMicOn((current) => !current);
  }

  return { micOn, toggleMic };
}
