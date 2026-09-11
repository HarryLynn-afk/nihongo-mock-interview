import { HashSessionCatcher } from "../HashSessionCatcher";

export default function AuthContinuePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-ink">
      <main className="flex w-full max-w-md flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Participant sign-in</h1>
        <HashSessionCatcher />
        <a href="/login" className="text-sm font-medium text-indigo">
          Participant login
        </a>
      </main>
    </div>
  );
}