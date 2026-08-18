import { profile } from "@/lib/content/profile";
import { getRubricPrompt, parseRawScores, scoreReport } from "@/lib/content/rubric";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

export type GradeAnswer = {
  questionIndex: number;
  inputMode: "voice" | "typed";
  transcript: string;
};

export type InterviewReport = ReturnType<typeof scoreReport> & {
  coaching: string[];
  profileName: string;
  source: "n8n" | "grade";
  banner: null;
};

export async function runGeminiGrade({
  answers,
  geminiFetch,
  getGradeKey,
}: {
  answers: GradeAnswer[];
  geminiFetch: typeof fetch;
  getGradeKey: () => string;
}): Promise<InterviewReport | null> {
  try {
    const res = await geminiFetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGradeKey(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: getRubricPrompt() }] },
        contents: [
          {
            parts: [{ text: JSON.stringify({ profile, answers }) }],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    const parsed = JSON.parse(text) as {
      scores?: unknown;
      coaching?: unknown;
    };
    const scored = scoreReport(parseRawScores(parsed.scores));
    const coaching = Array.isArray(parsed.coaching)
      ? parsed.coaching.filter((item): item is string => typeof item === "string")
      : [];
    return {
      ...scored,
      coaching,
      profileName: profile.name,
      source: "grade",
      banner: null,
    };
  } catch {
    return null;
  }
}
