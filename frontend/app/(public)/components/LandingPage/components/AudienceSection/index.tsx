import { ArrowRight } from "lucide-react";
import { audienceCards } from "../../constants";

export function AudienceSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {audienceCards.map(({ label, headline, pain, outcome }) => (
        <article
          key={label}
          className="group flex flex-col rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-100 to-transparent p-6 transition-[border-color,box-shadow] hover:border-primary-orange/35 hover:shadow-[0_0_40px_-8px_rgba(255,78,0,0.25)] dark:border-white/[0.08] dark:from-white/[0.04]"
        >
          <span className="inline-flex w-fit items-center rounded-full border border-primary-orange/30 bg-primary-orange/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-orange">
            {label}
          </span>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            {headline}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {pain}
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-primary-orange"
              strokeWidth={2}
            />
            {outcome}
          </p>
        </article>
      ))}
    </div>
  );
}
