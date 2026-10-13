const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** True when the text contains at least one Hiragana or Katakana character. */
export function hasJapaneseKana(text: string): boolean {
  return KANA.test(text);
}

export function transcriptPassesPushbackCheck(transcript: string): boolean {
  const trimmed = transcript.trim();
  return trimmed.length >= 2 && hasJapaneseKana(trimmed);
}
