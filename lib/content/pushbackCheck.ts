const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

export function transcriptPassesPushbackCheck(transcript: string): boolean {
  const trimmed = transcript.trim();
  return trimmed.length >= 2 && KANA.test(trimmed);
}
