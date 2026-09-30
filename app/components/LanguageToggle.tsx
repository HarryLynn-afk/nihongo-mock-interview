"use client";

import type { UiLocale } from "@/lib/content/locale";

export function LanguageToggle({
  locale,
  onChange,
}: {
  locale: UiLocale;
  onChange: (locale: UiLocale) => void;
}) {
  const idle = "text-eel/55 hover:text-eel";
  const active = "bg-feather text-white";

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 rounded-full border border-eel/10 bg-eel/5 p-0.5 text-xs font-medium"
    >
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => onChange("en")}
        className={`rounded-full px-2.5 py-1 ${locale === "en" ? active : idle}`}
      >
        ENG
      </button>
      <button
        type="button"
        aria-pressed={locale === "my"}
        onClick={() => onChange("my")}
        className={`rounded-full px-2.5 py-1 ${locale === "my" ? active : idle}`}
      >
        MM
      </button>
    </div>
  );
}
