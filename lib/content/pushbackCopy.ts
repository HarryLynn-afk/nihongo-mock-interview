import type { UiLocale } from "./locale";

export const PUSHBACK_TRY_AGAIN = {
  japanese: "すみません、もう一度お願いします。",
  english: "Sorry, could you try answering that again?",
  burmese: "တစ်ဖန်ထပ်ဖြေပေးပါဦးနော်။",
} as const;

export function tryAgainLineFor(locale: UiLocale = "en"): string {
  return locale === "my"
    ? PUSHBACK_TRY_AGAIN.burmese
    : PUSHBACK_TRY_AGAIN.english;
}
