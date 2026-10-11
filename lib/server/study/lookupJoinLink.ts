import type { JoinLinkRecord } from "@/lib/content/joinLink";
import { createStudyAdminClient } from "./adminClients";

export async function lookupJoinLink(code: string): Promise<JoinLinkRecord | null> {
  const admin = createStudyAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("invite_links")
    .select("signup_count, max_signups")
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;
  return {
    signupCount: data.signup_count as number,
    maxSignups: data.max_signups as number,
  };
}
