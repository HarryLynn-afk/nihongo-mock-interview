export type AudioSource = "tts" | "fallback";

export type ResolveArgs = {
  questionId: number;
  ttsFetch: (questionId: number, signal: AbortSignal) => Promise<Uint8Array>;
  fallbackReader: (questionId: number) => Promise<Uint8Array>;
  timeoutMs: number;
};

export type ResolvedAudio = {
  source: AudioSource;
  bytes: Uint8Array;
};

/**
 * Races the live ElevenLabs TTS fetch against a timeout. If the TTS
 * response doesn't win within timeoutMs (or throws), the local .mp3
 * fallback is used instead and the in-flight TTS is aborted. The
 * client never has to know which won — it just gets playable audio
 * bytes back.
 */
export async function resolveQuestionAudio(
  args: ResolveArgs,
): Promise<ResolvedAudio> {
  const { questionId, ttsFetch, fallbackReader, timeoutMs } = args;
  const controller = new AbortController();

  async function useFallback(): Promise<ResolvedAudio> {
    controller.abort();
    const bytes = await fallbackReader(questionId);
    return { source: "fallback", bytes };
  }

  const ttsPromise = ttsFetch(questionId, controller.signal).then(
    (bytes) => ({ source: "tts" as const, bytes }),
    // TTS failed outright — fall back immediately, don't wait for timeout.
    () => useFallback(),
  );

  const timeoutPromise = new Promise<ResolvedAudio>((resolve) => {
    setTimeout(() => resolve(useFallback()), timeoutMs);
  });

  return Promise.race([ttsPromise, timeoutPromise]);
}
