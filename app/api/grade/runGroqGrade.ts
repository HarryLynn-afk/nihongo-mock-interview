import { getRubricPrompt, parseRawScores, scoreReport } from "@/lib/content/rubric";
import { parseQuotedCritiques } from "@/lib/content/parseQuotedCritiques";
import type { InterviewReport } from "@/lib/content/sampleReport";

export type { InterviewReport };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_GRADE_MODEL = "qwen/qwen3.6-27b";

export type GradeAnswer = {
  questionIndex: number;
  inputMode: "voice" | "typed";
  transcript: string;
  pushbackCount: 0 | 1 | 2;
  forced: boolean;
};

export async function runGroqGrade({
  answers,
  groqFetch,
  getGradeKey,
}: {
  answers: GradeAnswer[];
  groqFetch: typeof fetch;
  getGradeKey: () => string;
}): Promise<InterviewReport | null> {
  try {
    const res = await groqFetch(GROQ_URL, {
      method: "POST",
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
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    const parsed = JSON.parse(text) as {
      scores?: unknown;
      critiques?: unknown;
    };
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
  }
}
