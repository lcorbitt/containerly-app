"use client";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean;
};

export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  disabled,
}: TablePaginationProps) {
  const totalPages = totalCount === 0 ? 0 : Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalCount);

  const canPrev = page > 0;
  const canNext = totalPages > 0 && page < totalPages - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {totalCount === 0 ? (
          "No rows"
        ) : (
          <>
            Showing <span className="tabular-nums">{from}</span>–
            <span className="tabular-nums">{to}</span> of{" "}
            <span className="tabular-nums">{totalCount}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">Rows per page</span>
          <select
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => {
              const n = Number(e.target.value);
              onPageSizeChange(n);
              onPageChange(0);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || !canPrev}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Previous
          </button>
          <span className="px-2 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            Page {totalCount === 0 ? 0 : page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={disabled || !canNext}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
