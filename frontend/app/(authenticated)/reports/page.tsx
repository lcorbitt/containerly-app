import { ReportsPageContent } from "./components/ReportsPageContent";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Reports
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Performance trends and operational insights — workflow funnel, carrier sync, and response
        times over time.
      </p>
      <div className="mt-8">
        <ReportsPageContent />
      </div>
    </div>
  );
}
