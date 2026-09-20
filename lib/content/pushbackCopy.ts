export const PUSHBACK_TRY_AGAIN = {
  japanese: "すみません、もう一度お願いします。",
  english: "Sorry, could you try answering that again?",
  burmese: "တစ်ဖန်ထပ်ဖြေပေးပါဦးနော်။",
} as const;

export function tryAgainLineFor(): string {
  return PUSHBACK_TRY_AGAIN.english;
}
