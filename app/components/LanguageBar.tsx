"use client";

import { LanguageToggle } from "./LanguageToggle";
import { useUiLocale } from "./useUiLocale";

export function LanguageBar({ className }: { className?: string }) {
  const { locale, setLocale } = useUiLocale();

  return (
    <div className={className ?? "absolute right-6 top-8 z-[70] md:right-12"}>
      <LanguageToggle locale={locale} onChange={setLocale} />
    </div>
  );
}
