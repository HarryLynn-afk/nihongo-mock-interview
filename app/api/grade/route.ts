import { NextResponse } from "next/server";
import { getGeminiGradeKey } from "@/lib/server/env/geminiGrade";
import { runGeminiGrade } from "./runGeminiGrade";
import { parseAnswers } from "./parseAnswers";

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

  const report = await runGeminiGrade({
    answers,
    geminiFetch: fetch,
    getGradeKey: getGeminiGradeKey,
  });

  return NextResponse.json({ report });
}
