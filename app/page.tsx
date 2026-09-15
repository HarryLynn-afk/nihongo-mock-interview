import Image from "next/image";
import { HashSessionCatcher } from "./auth/HashSessionCatcher";
import { JoinInterview } from "./components/JoinInterview";

const STEPS = [
  {
    title: "Check your camera and mic",
    detail: "Camera is optional — you can practice audio-only.",
  },
  {
    title: "Answer Tanaka-sensei's questions",
    detail: "Speak your answers in Japanese, with English and Burmese support.",
  },
  {
    title: "Get your coaching report",
    detail: "See what was strong, and one thing to try next.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <HashSessionCatcher idle />

      <header className="mx-auto w-full max-w-5xl px-6 pt-8 md:px-10">
        <p className="text-lg font-bold tracking-tight">NihonGo</p>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-6 py-10 text-center md:grid md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16 md:px-10 md:py-16 md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo">
            Japanese language-school interview practice
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Practice your interview with Tanaka-sensei
          </h2>
          <p className="mt-3 text-lg text-ink/70">
            Japanese language school interview practice
          </p>

          <ol className="mt-6 flex w-full flex-col gap-3 text-left">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/5 text-xs font-semibold text-ink"
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {step.title}
                  </span>
                  <span className="block text-xs text-ink/60">
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-sm text-ink/60">
            About 10–15 minutes · No account needed
          </p>

          <div className="mt-6 hidden w-full flex-col gap-3 md:flex">
            <p className="rounded-lg border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70">
              Guest practice is not saved and is not part of the study.
            </p>
            <JoinInterview />
            <a
              href="/login"
              className="w-full rounded-full border border-ink/15 px-5 py-3 text-center font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Participant login
            </a>
          </div>

          <p className="mt-6 w-full rounded-lg border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70 md:hidden">
            Open on a computer to join the interview.
          </p>
        </div>

        <figure className="hidden overflow-hidden rounded-3xl border border-ink/10 bg-ink shadow-xl md:block">
          <div className="relative aspect-[4/3.4] w-full">
            <Image
              src="/tanaka-sensei.png"
              alt="Tanaka-sensei"
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="flex items-center justify-between px-5 py-4 text-sm text-paper">
            <span>Tanaka-sensei</span>
            <span className="text-paper/60">Tokyo Pathway Japanese School</span>
          </figcaption>
        </figure>
      </main>
    </div>
  );
}
