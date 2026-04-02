import Link from "next/link";

export default function ReportNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Report not found</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This link may be invalid or the report may have been removed.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
        Back to home
      </Link>
    </div>
  );
}
