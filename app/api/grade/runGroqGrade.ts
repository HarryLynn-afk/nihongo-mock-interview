import { getRubricPrompt, parseRawScores, scoreReport } from "@/lib/content/rubric";
import { parseQuotedCritiques } from "@/lib/content/parseQuotedCritiques";
import type { InterviewReport } from "@/lib/content/sampleReport";
import {
  isGroqCapacityLimit,
  noteGroqCapacityLimit,
  shouldSkipGroqCall,
} from "../groqCapacity";

export type { InterviewReport };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_GRADE_MODEL = "qwen/qwen3.6-27b";

export type GradeAnswer = {
  questionIndex: number;
  transcript: string;
  pushbackCount: 0 | 1 | 2;
};

function parseGroqGradeJson(text: string): {
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

export async function runGroqGrade({
  answers,
  groqFetch,
  getGradeKey,
  timeoutMs = 20_000,
}: {
  answers: GradeAnswer[];
  groqFetch: typeof fetch;
  getGradeKey: () => string;
  timeoutMs?: number;
}): Promise<InterviewReport | null> {
  if (shouldSkipGroqCall("grade")) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await groqFetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getGradeKey()}`,
      },
      body: JSON.stringify({
        model: GROQ_GRADE_MODEL,
        messages: [
          { role: "system", content: getRubricPrompt() },
          { role: "user", content: JSON.stringify({ answers }) },
        ],
        temperature: 0,
        reasoning_effort: "none",
        response_format: { type: "json_object" },
      }),
    });
    if (isGroqCapacityLimit(res.status)) {
      noteGroqCapacityLimit("grade");
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    const parsed = parseGroqGradeJson(text);
    if (!parsed) return null;
    const scored = scoreReport(parseRawScores(parsed.scores), {
      assessSpeaking: false,
    });
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
