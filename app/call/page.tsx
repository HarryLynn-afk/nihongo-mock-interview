import { sessionHome } from "@/lib/server/study/sessionHome";
import { CallScreen } from "./CallScreen";

/**
 * Resolves where this session goes home (its invite link while open, else `/`)
 * and hands it to the classroom so the report's Back to home agrees with sign-out.
 */
export default async function CallPage() {
  const homeHref = await sessionHome();
  return <CallScreen homeHref={homeHref} />;
}
