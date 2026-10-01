import { getRubricPrompt, parseRawScores, scoreReport } from "@/lib/content/rubric";
import { parseQuotedCritiques } from "@/lib/content/parseQuotedCritiques";
import type { InterviewReport } from "@/lib/content/sampleReport";
import type { GradeAnswer } from "./runGroqGrade";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_GRADE_MODEL = "deepseek-flash";

function parseGradeJson(text: string): {
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

export async function runDeepseekGrade({
  answers,
  deepseekFetch,
  getGradeKey,
  timeoutMs = 20_000,
}: {
  answers: GradeAnswer[];
  deepseekFetch: typeof fetch;
  getGradeKey: () => string | null;
  timeoutMs?: number;
}): Promise<InterviewReport | null> {
  const key = getGradeKey();
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await deepseekFetch(DEEPSEEK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_GRADE_MODEL,
        messages: [
          { role: "system", content: getRubricPrompt() },
          { role: "user", content: JSON.stringify({ answers }) },
        ],
        temperature: 0,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    const parsed = parseGradeJson(text);
    if (!parsed) return null;
    const scored = scoreReport(parseRawScores(parsed.scores));
    const critiques = parseQuotedCritiques(parsed.critiques, answers);
    if (!critiques) return null;
    return {
      ...scored,
      critiques,
      profileName: "",
      source: "grade",
      banner: null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
