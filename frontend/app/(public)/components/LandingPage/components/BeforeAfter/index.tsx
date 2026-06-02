import { ArrowRight, Link2, Mail } from "lucide-react";
import { BEFORE_EMAIL_SUBJECTS } from "./constants";

export function BeforeAfter() {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-[1fr_auto_1fr]">
      <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-white/[0.08] dark:bg-white/[0.02]">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          Before
        </p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
          17 emails and still no clear answer
        </h3>
        <div className="mt-5 space-y-2" aria-hidden>
          {BEFORE_EMAIL_SUBJECTS.map((subject, i) => (
            <div
              key={subject}
              className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
              style={{ opacity: 1 - i * 0.13 }}
            >
              <Mail className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
              <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                {subject}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-orange/40 bg-primary-orange/10 text-primary-orange">
          <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" strokeWidth={2} />
        </div>
      </div>

      <div className="relative flex flex-col justify-center rounded-2xl border border-primary-orange/30 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent p-6">
        <p className="font-mono text-[10px] uppercase tracking-wider text-primary-orange">
          After
        </p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
          One live link your customer actually opens
        </h3>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-orange/10 text-primary-orange">
            <Link2 className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-medium text-zinc-900 dark:text-white">
              containerly.app/s/msku4821630
            </p>
            <p className="text-[11px] text-zinc-500">
              Live status, documents, and approvals
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No back and forth. They open the link and see everything in real time.
        </p>
      </div>
    </div>
  );
}
