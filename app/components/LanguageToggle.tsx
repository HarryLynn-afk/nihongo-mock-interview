"use client";

import type { UiLocale } from "@/lib/content/locale";

export function LanguageToggle({
  locale,
  onChange,
  variant = "dark",
}: {
  locale: UiLocale;
  onChange: (locale: UiLocale) => void;
  variant?: "light" | "dark";
}) {
  const frame =
    variant === "light"
      ? "border-ink/10 bg-ink/5"
      : "border-paper/15 bg-paper/5";
  const idle =
    variant === "light" ? "text-ink/55 hover:text-ink" : "text-paper/55 hover:text-paper";
  const active =
    variant === "light" ? "bg-indigo text-paper" : "bg-indigo text-paper";

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex shrink-0 rounded-full border p-0.5 text-xs font-medium ${frame}`}
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
