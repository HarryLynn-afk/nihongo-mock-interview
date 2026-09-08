"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/content/studyAuth";
import { JoinInterview } from "../components/JoinInterview";

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/study/me")
      .then((res) => res.json())
      .then((data: { participantId?: string | null; consented?: boolean }) => {
        if (data.participantId) {
          setParticipantId(data.participantId);
        }
      })
      .catch(() => {});
  }, []);

  async function handleConsent() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/study/consent", { method: "POST" });
      const data = (await res.json()) as { participantId?: string; error?: string };
      if (!res.ok || !data.participantId) {
        setError("This email is not in the invited-tester list.");
        return;
      }
      setParticipantId(data.participantId);
    } catch {
      setError("This email is not in the invited-tester list.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <main className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Study consent</h1>
        {participantId ? (
          <>
            <p className="text-sm text-ink/70">
              Your participant id is <strong>{participantId}</strong>. This id
              is shown in the app; your email is not.
            </p>
            <JoinInterview />
          </>
        ) : (
          <>
            <p className="text-sm text-ink/70">
              This practice Interview can be saved for the NihonGo user study
              (consent version {CONSENT_VERSION}). Answers and scores are stored
              under a participant id, not your name. Guest sessions stay
              separate and are not added to the study.
            </p>
            <label className="flex items-start gap-3 text-left text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-1"
              />
              I agree to take part and to save this session under a participant
              id.
            </label>
            <button
              type="button"
              disabled={!agreed || pending}
              onClick={() => void handleConsent()}
              className="rounded-full bg-indigo px-5 py-3 font-medium text-paper disabled:opacity-60"
            >
              Agree and continue
            </button>
            {error ? <p className="text-sm text-ink/80">{error}</p> : null}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm font-medium text-indigo"
            >
              Try as guest instead
            </button>
          </>
        )}
      </main>
    </div>
  );
}
