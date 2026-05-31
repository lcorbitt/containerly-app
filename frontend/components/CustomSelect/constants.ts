export const triggerClass =
  "flex w-full items-center justify-between gap-2 rounded-md border-0 bg-transparent p-2 text-left text-sm text-zinc-900 transition-colors hover:bg-zinc-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50 dark:focus-visible:ring-zinc-500/40 dark:focus-visible:ring-offset-zinc-950";

export const listRevealClass = "absolute z-50 mt-2 w-full min-w-[12rem]";

export const listPanelClass =
  "max-h-60 overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950";

export const optionClass = (active: boolean) =>
  `flex w-full p-2 text-left text-sm ${
    active
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900/80"
  }`;
