import { Check, FileText, Ship } from "lucide-react";
import {
  MOCK_ETA,
  MOCK_ROUTE,
  MOCK_SHIPMENT_REF,
  mockDocuments,
  mockMilestones,
} from "./constants";

export function PortalMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary-orange/10 blur-2xl dark:bg-primary-orange/20"
        aria-hidden
      />
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0_0_60px_-15px_rgba(255,78,0,0.35)]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-orange/10 text-primary-orange">
              <Ship className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-mono text-xs font-medium text-zinc-900 dark:text-white">
                {MOCK_SHIPMENT_REF}
              </p>
              <p className="text-[11px] text-zinc-500">{MOCK_ROUTE}</p>
            </div>
          </div>
          <span className="rounded-full border border-primary-orange/30 bg-primary-orange/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-orange">
            In transit
          </span>
        </div>

        <div className="px-5 py-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Milestones
            </p>
            <p className="text-[11px] font-medium text-zinc-500">{MOCK_ETA}</p>
          </div>
          <ol className="mt-3 space-y-3">
            {mockMilestones.map(({ label, meta, state }) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={
                    state === "done"
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary-orange text-white"
                      : state === "current"
                        ? "flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary-orange bg-primary-orange/15"
                        : "flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 dark:border-white/15"
                  }
                >
                  {state === "done" ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : state === "current" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />
                  ) : null}
                </span>
                <span className="flex flex-1 items-center justify-between">
                  <span
                    className={
                      state === "upcoming"
                        ? "text-sm text-zinc-400 dark:text-zinc-500"
                        : "text-sm font-medium text-zinc-800 dark:text-zinc-100"
                    }
                  >
                    {label}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {meta}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-zinc-200 px-5 py-4 dark:border-white/10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Documents
          </p>
          <div className="space-y-2">
            {mockDocuments.map(({ name, status }) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-white/10"
              >
                <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FileText
                    className="h-4 w-4 text-zinc-400"
                    strokeWidth={1.75}
                  />
                  {name}
                </span>
                {status === "approved" ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Approved
                  </span>
                ) : (
                  <span className="rounded-full bg-primary-orange px-3 py-1 text-[11px] font-semibold text-white">
                    Approve
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-zinc-200 bg-zinc-50 px-5 py-2.5 dark:border-white/10 dark:bg-white/[0.02]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Powered by Containerly
          </span>
        </div>
      </div>
    </div>
  );
}
