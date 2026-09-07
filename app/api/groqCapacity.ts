/** Process-local Groq skip after 429/503/529 so a demo does not keep hitting a limited key. */
export type GroqPurpose = "grade" | "translate";

const DEFAULT_COOLDOWN_MS = 60_000;

const cooldownUntil: Record<GroqPurpose, number> = {
  grade: 0,
  translate: 0,
};

export function isGroqCapacityLimit(status: number): boolean {
  return status === 429 || status === 503 || status === 529;
}

export function shouldSkipGroqCall(
  purpose: GroqPurpose,
  now = Date.now(),
): boolean {
  return now < cooldownUntil[purpose];
}

export function noteGroqCapacityLimit(
  purpose: GroqPurpose,
  now = Date.now(),
  cooldownMs = DEFAULT_COOLDOWN_MS,
): void {
  cooldownUntil[purpose] = now + cooldownMs;
}

export function resetGroqCapacityForTests(): void {
  cooldownUntil.grade = 0;
  cooldownUntil.translate = 0;
}
