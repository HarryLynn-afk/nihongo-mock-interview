"use client";

import { LanguageToggle } from "./LanguageToggle";
import { useUiLocale } from "./useUiLocale";

export function LanguageBar({
  variant,
  className,
}: {
  variant: "light" | "dark";
  className?: string;
}) {
  const { locale, setLocale } = useUiLocale();
  const position =
    variant === "light"
      ? "absolute right-6 top-8 z-[70] md:right-12"
      : "absolute right-4 top-4 z-[70] md:right-6 md:top-6";

  return (
    <div className={className ?? position}>
      <LanguageToggle locale={locale} onChange={setLocale} variant={variant} />
    </div>
  );
}
