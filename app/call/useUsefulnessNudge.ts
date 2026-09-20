"use client";

import { useEffect, useRef, useState } from "react";

/** Time after the report reveal before Help the study auto-opens. */
export const USEFULNESS_NUDGE_MS = 8_000;

export function useUsefulnessNudge(ready: boolean) {
  const [open, setOpen] = useState(false);
  const nudgedRef = useRef(false);

  useEffect(() => {
    if (!ready || nudgedRef.current) return;
    const timer = window.setTimeout(() => {
      nudgedRef.current = true;
      setOpen(true);
    }, USEFULNESS_NUDGE_MS);
    return () => window.clearTimeout(timer);
  }, [ready, open]);

  function openNow() {
    nudgedRef.current = true;
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  return { open, openNow, close };
}
