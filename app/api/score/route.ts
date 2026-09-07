import { NextResponse } from "next/server";
import { getGroqGradeKey } from "@/lib/server/env/groqGrade";
import { getN8nWebhookUrl } from "@/lib/server/env/n8n";
import { gradeInterview } from "../grade/gradeInterview";
import { parseAnswers } from "../grade/parseAnswers";
import { runGroqGrade } from "../grade/runGroqGrade";

/** n8n wait is 20s, then Groq. Keep the route alive long enough for both. */
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = parseAnswers(
    typeof body === "object" && body !== null && "answers" in body
      ? (body as { answers: unknown }).answers
      : undefined,
  );
  if (!answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }

  const report = await gradeInterview({
    answers,
    n8nFetch: fetch,
    getWebhookUrl: getN8nWebhookUrl,
    fallback: () =>
      runGroqGrade({
        answers,
        groqFetch: fetch,
        getGradeKey: getGroqGradeKey,
      }),
  });

  return NextResponse.json({ report });
}
