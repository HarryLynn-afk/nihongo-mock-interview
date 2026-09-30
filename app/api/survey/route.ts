import { NextResponse } from "next/server";
import { getResearchFormUrl } from "@/lib/server/env/researchForm";
import { withApiGuard } from "@/lib/server/security/guard";
import type { SurveyPayload } from "@/lib/content/survey";
import { postSurvey } from "./postSurvey";

export function GET() {
  return NextResponse.json({ enabled: Boolean(getResearchFormUrl()) });
}

export const POST = withApiGuard(async (request) => {
  const url = getResearchFormUrl();
  if (!url) {
    return new Response(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await postSurvey({
    url,
    payload: body as SurveyPayload,
    fetchImpl: fetch,
  });
  return new Response(null, { status: 202 });
}, "write");
