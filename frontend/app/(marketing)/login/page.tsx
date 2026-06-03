import { Suspense } from "react";
import { LoginForm } from "./components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="landing-grid-bg absolute inset-0" />
        <div className="landing-hero-glow opacity-60" />
      </div>
      <div className="relative z-[1] w-full max-w-sm">
        <Suspense fallback={<p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
