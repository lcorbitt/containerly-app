import type { ReactNode } from "react";

export {
  ADMIN_TABLE_HEAD_ROW,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
} from "./constants";

type AdminTableSectionProps = {
  title: string;
  description?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  /** Shown in toolbar area when no custom toolbar */
  summary?: string;
  children: ReactNode;
};

/**
 * Card + scroll region for large admin datasets: sticky header inside max-height viewport.
 */
export function AdminTableSection({
  title,
  description,
  toolbar,
  footer,
  summary,
  children,
}: AdminTableSectionProps) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            {description ? (
              <div className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {description}
              </div>
            ) : null}
          </div>
          {summary && !toolbar ? (
            <p className="shrink-0 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              {summary}
            </p>
          ) : null}
        </div>
      </div>
      {toolbar ? (
        <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/30 sm:px-5">
          {toolbar}
        </div>
      ) : null}
      <div className="min-h-0 max-h-[min(65vh,720px)] overflow-auto overscroll-contain">
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 sm:px-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
