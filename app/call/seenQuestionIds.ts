const SEEN_KEY = "nihongo-seen-question-ids";

export function loadSeenQuestionIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is number => typeof item === "number");
  } catch {
    return [];
  }
}

export function saveSeenQuestionIds(ids: readonly number[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // Question rotation is optional when storage is unavailable.
  }
}
