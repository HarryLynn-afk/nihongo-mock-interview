import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PITCH_GATE_COOKIE, pitchGateIsOpen } from "@/lib/content/pitchGate";
import { getPitchAccessKey } from "@/lib/server/env/pitchAccess";
import { PitchLanding } from "./PitchLanding";
import { PitchUnlockForm } from "./PitchUnlockForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Pitch mode's own landing route — the CSC 492 oral-exam / project-
 * presentation demo path. Not linked from `/`. Locked until the access
 * key sets an HttpOnly cookie; `/call?pitch=1` is gated in middleware.
 */
export default async function PitchPage() {
  const jar = await cookies();
  const unlocked = await pitchGateIsOpen(
    jar.get(PITCH_GATE_COOKIE)?.value,
    getPitchAccessKey(),
  );
  return unlocked ? <PitchLanding /> : <PitchUnlockForm />;
}
