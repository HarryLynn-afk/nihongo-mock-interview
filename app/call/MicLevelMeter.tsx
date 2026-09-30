"use client";

import { useEffect, useState } from "react";
import { useCopy } from "../components/useUiLocale";

/** Root-mean-square of centered 8-bit time-domain samples, in 0..1. */
export function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const centered = (data[i] - 128) / 128;
    sum += centered * centered;
  }
  return data.length ? Math.sqrt(sum / data.length) : 0;
}

/** Bar floor. Below this the bar reads 0; 0 dBFS reads 100. */
const MIC_LEVEL_FLOOR_DB = -60;

/**
 * Map mic RMS (0..1) to a 0-100 bar on a dB scale, so normal speech reads
 * mid-bar instead of a near-zero sliver (linear RMS sits ~2-10%).
 */
export function micLevelPercent(rms: number): number {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  const fraction = Math.min(
    1,
    Math.max(0, (db - MIC_LEVEL_FLOOR_DB) / -MIC_LEVEL_FLOOR_DB),
  );
  return Math.round(fraction * 100);
}

/**
 * Live microphone level for the lobby. Reuses the stream the lobby already
 * holds (never opens a second getUserMedia) and reads it through Web Audio.
 * Renders nothing when there is no stream.
 */
export function MicLevelMeter({ stream }: { stream: MediaStream | null }) {
  const { copy } = useCopy();
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream) return;
    if (typeof AudioContext === "undefined") return;

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      analyser.getByteTimeDomainData(data);
      setLevel(rmsFromTimeDomain(data));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void context.close();
    };
  }, [stream]);

  if (!stream) return null;
  const percent = micLevelPercent(level);

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-feather/15">
      <div
        role="meter"
        aria-label={copy.lobby.mic}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-full rounded-full bg-feather transition-[width] duration-100"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
