export const NAVIGATION_PROGRESS_SHOW_DELAY_MS = 80;

export const NAVIGATION_PROGRESS_COMPLETE_MS = 250;

export const NAVIGATION_PROGRESS_SHELL_CLASS =
  "pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 overflow-hidden";

export const NAVIGATION_PROGRESS_TRACK_CLASS =
  "h-full w-full origin-left bg-zinc-900/90 motion-reduce:transition-none dark:bg-zinc-100/90";

export const NAVIGATION_PROGRESS_ACTIVE_CLASS =
  "animate-[navigation-progress-indeterminate_1.1s_ease-in-out_infinite] opacity-100";

export const NAVIGATION_PROGRESS_COMPLETING_CLASS =
  "animate-none opacity-100 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none";

export const NAVIGATION_PROGRESS_HIDDEN_CLASS = "scale-x-0 opacity-0";
