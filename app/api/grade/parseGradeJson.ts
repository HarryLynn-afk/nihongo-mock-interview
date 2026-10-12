export function parseGradeJson(text: string): {
  scores?: unknown;
  critiques?: unknown;
} | null {
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const unfenced = withoutThink
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const candidates = [unfenced];
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.push(unfenced.slice(start, end + 1));
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as {
        scores?: unknown;
        critiques?: unknown;
      };
    } catch {
      continue;
    }
  }
  return null;
}
