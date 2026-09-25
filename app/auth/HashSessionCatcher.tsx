"use client";

import { createBrowserClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readJoinFrom } from "@/lib/content/joinLink";
import { nextAfterAuth } from "@/lib/content/visitPolicy";
import {
  MAGIC_LINK_EXPIRED_COPY,
  MAGIC_LINK_MISSING_COPY,
  readAuthCallback,
} from "@/lib/content/studyAuth";
import { localizeAuthMessage } from "@/lib/content/uiCopy";
import { useCopy } from "../components/useUiLocale";

export function HashSessionCatcher({
  idle = false,
}: {
  idle?: boolean;
}) {
  const router = useRouter();
  const { locale } = useCopy();
  const [status, setStatus] = useState<string | null>(idle ? null : "Signing you in…");

  useEffect(() => {
    const intent = readAuthCallback(window.location.search, window.location.hash);

    if (intent.kind === "none") {
      // Hydration safety: window.location is only readable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time external read
      if (!idle) setStatus(MAGIC_LINK_MISSING_COPY);
      return;
    }
    if (intent.kind === "error") {
      setStatus(intent.message);
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setStatus("Sign-in is not configured.");
      return;
    }

    setStatus("Signing you in…");
    const supabase = createBrowserClient(url, anon);
    let settled = false;
    let expireTimerId: ReturnType<typeof setTimeout> | undefined;

    function finish(session: { access_token?: string } | null | undefined) {
      if (settled || !session) return;
      settled = true;
      if (expireTimerId !== undefined) clearTimeout(expireTimerId);
      void (async () => {
        const response = await fetch("/api/auth/consent-gate", { method: "POST" });
        if (!response.ok) {
          setStatus("Sign-in could not be completed.");
          return;
        }
        const from = readJoinFrom(window.location.search);
        router.replace(nextAfterAuth({ from, ok: true }));
      })();
    }

    function fail(message: string) {
      if (settled) return;
      setStatus(message);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      finish(session);
    });

    void (async () => {
      if (intent.kind === "code") {
        const { data, error } = await supabase.auth.exchangeCodeForSession(intent.code);
        finish(data.session);
        if (error) console.error("sign-in failed:", error.message);
        fail(MAGIC_LINK_EXPIRED_COPY);
        return;
      }
      if (intent.kind === "otp") {
        const { data, error } = await supabase.auth.verifyOtp({
          type: intent.type as EmailOtpType,
          token_hash: intent.tokenHash,
        });
        finish(data.session);
        if (error) console.error("sign-in failed:", error.message);
        fail(MAGIC_LINK_EXPIRED_COPY);
        return;
      }
      const { data } = await supabase.auth.getSession();
      finish(data.session);
      if (!settled) {
        expireTimerId = setTimeout(() => fail(MAGIC_LINK_EXPIRED_COPY), 2000);
      }
    })();

    return () => {
      subscription.unsubscribe();
      if (expireTimerId !== undefined) clearTimeout(expireTimerId);
    };
  }, [idle, router]);

  if (!status) return null;
  return (
    <p className="text-sm text-ink/70">{localizeAuthMessage(status, locale)}</p>
  );
}
