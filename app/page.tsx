import { JoinInterview } from "./components/JoinInterview";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-semibold tracking-tight">NihonGo</h1>
          <p className="text-lg text-ink/70">
            Japanese language school interview practice
          </p>
        </div>

        <div className="hidden w-full flex-col gap-3 md:flex">
          <JoinInterview />
        </div>

        <p className="w-full rounded-lg border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70 md:hidden">
          Open on a computer to join the interview.
        </p>
      </main>
    </div>
  );
}
