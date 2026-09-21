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

export async function consumeInviteSlot(code: string): Promise<boolean> {
  const admin = createStudyAdminClient();
  if (!admin) return false;
  const { data, error } = await admin.rpc("consume_invite_slot", {
    invite_code: code,
  });
  if (error) return false;
  return data === true;
}

export async function addInvitedEmail(email: string): Promise<void> {
  const admin = createStudyAdminClient();
  if (!admin) return;
  await admin.from("invited_emails").upsert({ email }, { onConflict: "email" });
}
