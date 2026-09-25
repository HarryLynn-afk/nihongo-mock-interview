"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_UI_LOCALE,
  UI_LOCALE_STORAGE_KEY,
  isUiLocale,
  type UiLocale,
} from "@/lib/content/locale";
import { UI_COPY, type UiCopy } from "@/lib/content/uiCopy";

let sharedLocale: UiLocale = DEFAULT_UI_LOCALE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): UiLocale {
  return sharedLocale;
}

function getServerSnapshot(): UiLocale {
  return DEFAULT_UI_LOCALE;
}

function setSharedLocale(next: UiLocale) {
  sharedLocale = next;
  listeners.forEach((listener) => listener());
}

function readStoredLocale(): UiLocale {
  const stored = sessionStorage.getItem(UI_LOCALE_STORAGE_KEY);
  return isUiLocale(stored) ? stored : DEFAULT_UI_LOCALE;
}

export function resetUiLocaleForTests() {
  setSharedLocale(DEFAULT_UI_LOCALE);
}

export function useUiLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Read the stored locale once after mount (not during render — the call
  // hydration rule forbids touching sessionStorage while drawing).
  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== sharedLocale) setSharedLocale(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "my" ? "my" : "en";
  }, [locale]);

  const setLocale = useCallback((next: UiLocale) => {
    sessionStorage.setItem(UI_LOCALE_STORAGE_KEY, next);
    setSharedLocale(next);
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
