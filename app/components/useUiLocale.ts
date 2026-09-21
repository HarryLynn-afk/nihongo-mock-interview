"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_UI_LOCALE,
  UI_LOCALE_STORAGE_KEY,
  isUiLocale,
  type UiLocale,
} from "@/lib/content/locale";
import { UI_COPY, type UiCopy } from "@/lib/content/uiCopy";

let sharedLocale: UiLocale = DEFAULT_UI_LOCALE;
const listeners = new Set<(locale: UiLocale) => void>();

export function resetUiLocaleForTests() {
  sharedLocale = DEFAULT_UI_LOCALE;
  listeners.forEach((listener) => listener(sharedLocale));
}

function readStoredLocale(): UiLocale {
  const stored = sessionStorage.getItem(UI_LOCALE_STORAGE_KEY);
  return isUiLocale(stored) ? stored : DEFAULT_UI_LOCALE;
}

export function useUiLocale() {
  const [locale, setLocaleState] = useState<UiLocale>(sharedLocale);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== sharedLocale) {
      sharedLocale = stored;
      listeners.forEach((listener) => listener(stored));
    } else {
      setLocaleState(stored);
    }
    const listener = (next: UiLocale) => setLocaleState(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "my" ? "my" : "en";
  }, [locale]);

  const setLocale = useCallback((next: UiLocale) => {
    sharedLocale = next;
    sessionStorage.setItem(UI_LOCALE_STORAGE_KEY, next);
    listeners.forEach((listener) => listener(next));
  }, []);

  return { locale, setLocale };
}

export function useCopy(): {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  copy: UiCopy;
} {
  const { locale, setLocale } = useUiLocale();
  return { locale, setLocale, copy: UI_COPY[locale] };
}
