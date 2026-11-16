import { cookies } from "next/headers";
import { DEVICE_INVITE_COOKIE } from "@/lib/content/joinLink";
import { inviteHome } from "@/lib/content/visitPolicy";
import { lookupJoinLink } from "./lookupJoinLink";

/**
 * Where this session goes home. Reads this device's saved invite and returns
 * its link while it is still open, otherwise the normal landing. Shared by
 * sign-out and guest interview exits. Participants return to their login landing.
 */
export async function sessionHome(): Promise<"/" | `/join?from=${string}`> {
  const inviteCode = (await cookies()).get(DEVICE_INVITE_COOKIE)?.value ?? null;
  const link = inviteCode ? await lookupJoinLink(inviteCode) : null;
  return inviteHome(inviteCode, link);
}
