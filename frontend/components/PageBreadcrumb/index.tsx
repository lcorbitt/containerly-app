import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const PAGE_BREADCRUMB_LINK_CLASS =
  "inline-flex items-center gap-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export function PageBreadcrumb({
  href,
  label,
  suffix,
  className,
}: {
  href: string;
  label: string;
  /** Optional static segment after the link (e.g. current page context). */
  suffix?: string;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <li>
          <Link href={href} className={PAGE_BREADCRUMB_LINK_CLASS}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        </li>
        {suffix ? (
          <li className="text-zinc-400 dark:text-zinc-500" aria-current="page">
            · {suffix}
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
