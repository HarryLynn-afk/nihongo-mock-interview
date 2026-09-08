import { analyzePcm, notAssessedClip, type AnalyzedClip } from "@/lib/content/deliverySignals";

export async function analyzeAudioClip(
  clip: Blob,
  transcript: string,
): Promise<AnalyzedClip> {
  if (clip.size === 0) return notAssessedClip();
  const AudioContextCtor =
    globalThis.AudioContext ??
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return notAssessedClip();

  const context = new AudioContextCtor();
  try {
    const buffer = await clip.arrayBuffer();
    const decoded = await context.decodeAudioData(buffer.slice(0));
    const samples = decoded.getChannelData(0);
    return analyzePcm({
      samples,
      sampleRate: decoded.sampleRate,
      transcript,
    });
  } catch {
    return notAssessedClip();
  } finally {
    await context.close().catch(() => undefined);
  }
}
