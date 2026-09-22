import { NextResponse } from "next/server";
import { getDeepseekGradeKey } from "@/lib/server/env/deepseekGrade";
import { getGroqGradeKey } from "@/lib/server/env/groqGrade";
import { gradeInterview } from "../grade/gradeInterview";
import { parseAnswers } from "../grade/parseAnswers";
import { runDeepseekGrade } from "../grade/runDeepseekGrade";
import { runGroqGrade } from "../grade/runGroqGrade";

/** Groq/DeepSeek grade can be slow; keep the route alive for in-process calls. */
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
    primary: () =>
      runGroqGrade({
        answers,
        groqFetch: fetch,
        getGradeKey: getGroqGradeKey,
      }),
    secondary: () =>
      runDeepseekGrade({
        answers,
        deepseekFetch: fetch,
        getGradeKey: getDeepseekGradeKey,
      }),
  });

  return NextResponse.json({ report });
}
