"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  DASHBOARD_BREAKDOWN_CARD_BAR_FILL_CLASS,
  DASHBOARD_BREAKDOWN_CARD_BAR_TRACK_CLASS,
  DASHBOARD_BREAKDOWN_CARD_EYEBROW_CLASS,
  DASHBOARD_BREAKDOWN_CARD_LINK_CLASS,
  DASHBOARD_BREAKDOWN_CARD_LIST_CLASS,
  DASHBOARD_BREAKDOWN_CARD_LOADING_CLASS,
  DASHBOARD_BREAKDOWN_CARD_PANEL_BODY_CLASS,
  DASHBOARD_BREAKDOWN_CARD_PANEL_CLASS,
  DASHBOARD_BREAKDOWN_CARD_ROW_LABEL_CLASS,
  DASHBOARD_BREAKDOWN_CARD_ROW_VALUE_CLASS,
  DASHBOARD_BREAKDOWN_CARD_SUBTITLE_CLASS,
  DASHBOARD_BREAKDOWN_CARD_TITLE_CLASS,
} from "./constants";
import type { DashboardBreakdownCardProps } from "./types";
import { breakdownBarWidth, breakdownCardTotal } from "./utils";

export function DashboardBreakdownCard({
  eyebrow,
  title,
  subtitle,
  rows,
  loading = false,
  emptyMessage = "No data yet.",
  linkHref,
  linkLabel,
  totalOverride,
}: DashboardBreakdownCardProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_BREAKDOWN_CARD_PANEL_CLASS} aria-busy="true">
        <div className={DASHBOARD_BREAKDOWN_CARD_PANEL_BODY_CLASS}>
          {eyebrow ? <p className={DASHBOARD_BREAKDOWN_CARD_EYEBROW_CLASS}>{eyebrow}</p> : null}
          <h2 className={DASHBOARD_BREAKDOWN_CARD_TITLE_CLASS}>{title}</h2>
          <div className={DASHBOARD_BREAKDOWN_CARD_LOADING_CLASS}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  const total = breakdownCardTotal(rows, totalOverride);
  const headingId = `dashboard-breakdown-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className={DASHBOARD_BREAKDOWN_CARD_PANEL_CLASS} aria-labelledby={headingId}>
      <div className={`${DASHBOARD_BREAKDOWN_CARD_PANEL_BODY_CLASS} flex h-full flex-col`}>
        <div>
          {eyebrow ? <p className={DASHBOARD_BREAKDOWN_CARD_EYEBROW_CLASS}>{eyebrow}</p> : null}
          <h2 id={headingId} className={DASHBOARD_BREAKDOWN_CARD_TITLE_CLASS}>
            {title}
          </h2>
          {subtitle ? <p className={DASHBOARD_BREAKDOWN_CARD_SUBTITLE_CLASS}>{subtitle}</p> : null}
        </div>

        {total === 0 ? (
          <p className="mt-4 flex flex-1 items-center text-sm text-zinc-500 dark:text-zinc-400">
            {emptyMessage}
          </p>
        ) : (
          <ul className={DASHBOARD_BREAKDOWN_CARD_LIST_CLASS}>
            {rows.map((row) => (
              <li key={row.key}>
                <div className="mb-1 flex justify-between gap-2">
                  <span className={DASHBOARD_BREAKDOWN_CARD_ROW_LABEL_CLASS}>{row.label}</span>
                  <span className={DASHBOARD_BREAKDOWN_CARD_ROW_VALUE_CLASS}>{row.count}</span>
                </div>
                <div className={DASHBOARD_BREAKDOWN_CARD_BAR_TRACK_CLASS}>
                  <div
                    className={`${DASHBOARD_BREAKDOWN_CARD_BAR_FILL_CLASS} ${row.barClass}`}
                    style={{ width: `${breakdownBarWidth(row.count, total)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {linkHref && linkLabel ? (
          <Link href={linkHref} className={`${DASHBOARD_BREAKDOWN_CARD_LINK_CLASS} mt-auto pt-4`}>
            {linkLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
