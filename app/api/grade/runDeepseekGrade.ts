import { getRubricPrompt, parseRawScores, scoreReport } from "@/lib/content/rubric";
import { parseQuotedCritiques } from "@/lib/content/parseQuotedCritiques";
import type { InterviewReport } from "@/lib/content/sampleReport";
import { parseGradeJson } from "./parseGradeJson";
import type { GradeAnswer } from "./runGroqGrade";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_GRADE_MODEL = "deepseek-flash";

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
