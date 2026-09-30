"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FullSessionRequestDialog } from "./FullSessionRequestDialog";
import { GoogleSignInDialog } from "./GoogleSignInDialog";
import { useCopy } from "./useUiLocale";

/**
 * Participant login dialog. The URL stays `/login` (middleware still sends
 * unsigned visits here). In-app clicks intercept into `@modal` so the start
 * screen stays mounted underneath.
 * Google starts through `/api/auth/login-google`, which has no invite code.
 */
export function ParticipantLoginDialog({
  dismiss = "replace",
}: {
  /** Soft opens sit on top of `/` in history. Hard visits to `/login` replace. */
  dismiss?: "back" | "replace";
}) {
  const router = useRouter();
  const { copy } = useCopy();
  const [notInvited, setNotInvited] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestStep, setRequestStep] = useState<"form" | "saved" | null>(null);
  const message = notInvited ? copy.login.errorNotInvited : notice;

  function close() {
    if (dismiss === "back") router.back();
    else router.replace("/", { scroll: false });
  }

  useEffect(() => {
    const error = new URLSearchParams(window.location.search ?? "").get("error");
    // Hydration safety: the query string is only readable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time external read
    if (error === "not_invited") setNotInvited(true);
  }, []);

  async function startGoogle() {
    setNotInvited(false);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/login-google", { method: "POST" });
      const data = (await res.json()) as { url?: string | null };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setNotice(copy.auth.notConfigured);
    } catch {
      setNotice(copy.auth.notConfigured);
    }
  }

  if (requestStep) {
    return (
      <FullSessionRequestDialog
        step={requestStep}
        onClose={() => setRequestStep(null)}
        onSent={() => setRequestStep("saved")}
      />
    );
  }

  return (
    <GoogleSignInDialog
      title={copy.login.title}
      body={copy.login.body}
      message={message}
      messageAction={
        notInvited
          ? {
              label: copy.login.requestInvite,
              onClick: () => setRequestStep("form"),
            }
          : undefined
      }
      onClose={close}
      onContinue={startGoogle}
    />
  );
}
