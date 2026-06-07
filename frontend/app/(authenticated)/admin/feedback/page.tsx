import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminFeedbackTable } from "@/app/(authenticated)/admin/components/AdminFeedbackTable";

export const dynamic = "force-dynamic";

export default function AdminFeedbackPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Platform administration
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Feedback
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Review in-app feedback from operators and customers. New submissions also notify your team
            via Slack and email when configured.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4 opacity-80" aria-hidden />
          Users
        </Link>
      </header>

      <AdminFeedbackTable />
    </div>
  );
}
