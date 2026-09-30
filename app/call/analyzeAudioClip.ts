import { analyzePcm, notAssessedClip, type AnalyzedClip } from "@/lib/content/deliverySignals";
import { wavBlobToPcm } from "./pcmAudio";

export async function analyzeAudioClip(
  clip: Blob,
  transcript: string,
): Promise<AnalyzedClip> {
  if (clip.size === 0) return notAssessedClip("empty");
  const buffer = await clip.arrayBuffer();
  const wav = wavBlobToPcm(buffer);
  if (wav) {
    return analyzePcm({
      samples: wav.samples,
      sampleRate: wav.sampleRate,
      transcript,
    });
  }

  const AudioContextCtor =
    globalThis.AudioContext ??
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return notAssessedClip();

  const context = new AudioContextCtor();
  try {
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
