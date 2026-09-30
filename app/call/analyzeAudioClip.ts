import { unableClip, type AnalyzedClip } from "@/lib/content/deliverySignals";

/**
 * Legacy clip helper. Delivery coaching now uses Deepgram word timestamps;
 * non-empty clips without timings are unable to assess (never RMS-graded).
 */
export async function analyzeAudioClip(clip: Blob): Promise<AnalyzedClip> {
  if (clip.size === 0) return unableClip("empty");
  return unableClip("noTimestamps");
}
