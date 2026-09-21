export type UiLocale = "en" | "my";

export const DEFAULT_UI_LOCALE: UiLocale = "en";
export const UI_LOCALE_STORAGE_KEY = "nihongo-ui-locale";

export function isUiLocale(value: string | null | undefined): value is UiLocale {
  return value === "en" || value === "my";
}

export function helperLinesForLocale(
  locale: UiLocale,
  lines: { english: string; burmese: string },
): { english: string | null; burmese: string | null } {
  return locale === "my"
    ? { english: null, burmese: lines.burmese }
    : { english: lines.english, burmese: null };
}
