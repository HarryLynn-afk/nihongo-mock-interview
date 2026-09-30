import { tryAgainLineFor } from "@/lib/content/pushbackCopy";
import type { UiLocale } from "@/lib/content/locale";

export function TryAgainBanner({ locale = "en" }: { locale?: UiLocale }) {
  return (
    <p
      role="status"
      data-testid="try-again-banner"
      className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800"
    >
      {tryAgainLineFor(locale)}
    </p>
  );
}
