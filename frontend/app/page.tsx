import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Containerly</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Logistics visibility on Supabase
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Multi-tenant container tracking with Postgres RLS, Edge Function sync against external APIs,
          cached state in the database, and alerts on exceptions.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
