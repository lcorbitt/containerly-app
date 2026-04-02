"use client";

import { FileText } from "lucide-react";

/**
 * Future: rows from object storage (Supabase Storage, S3, etc.). Wire `storedFiles` when uploads exist.
 */
export type DocumentsListStoredFile = {
  id: string;
  name: string;
  href?: string;
};

export type DocumentsListProps = {
  billOfLading?: string;
  /** Object-storage files; reserved for upcoming upload / file UI. */
  storedFiles?: DocumentsListStoredFile[];
};

export function DocumentsList({ billOfLading, storedFiles }: DocumentsListProps) {
  const bol = billOfLading?.trim() ?? "";
  const hasStored = storedFiles && storedFiles.length > 0;
  const hasAny = Boolean(bol) || hasStored;

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-[min(320px,calc(100dvh-14rem))]">
      <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {hasAny ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {bol ? (
              <li className="flex items-start gap-2 px-2 py-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Bill of lading
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">{bol}</p>
                </div>
              </li>
            ) : null}
            {storedFiles?.map((f) => (
              <li key={f.id}>
                {f.href ? (
                  <a
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 font-medium text-zinc-800 dark:text-zinc-200">{f.name}</span>
                  </a>
                ) : (
                  <div className="flex items-start gap-2 px-2 py-2.5 text-sm">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 text-zinc-800 dark:text-zinc-200">{f.name}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">No documents yet.</p>
        )}
      </div>
    </div>
  );
}
