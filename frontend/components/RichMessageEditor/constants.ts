export const RICH_MESSAGE_EDITOR_SHELL_CLASS =
  "relative min-w-0 flex-1 overflow-y-auto outline-none";

export const RICH_MESSAGE_EDITOR_INNER_CLASS =
  "min-h-[1.5rem] max-h-40 px-1 py-1.5 text-sm leading-relaxed text-zinc-800 outline-none dark:text-zinc-200 [&_.ProseMirror]:min-h-[1.5rem] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-zinc-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] dark:[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-zinc-500";

export const RICH_MESSAGE_FORMATTING_BUBBLE_CLASS =
  "flex items-center gap-0.5 rounded-lg border border-zinc-700/80 bg-zinc-900 px-1 py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-950";

export const RICH_MESSAGE_FORMATTING_BUBBLE_BUTTON_CLASS =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export const RICH_MESSAGE_FORMATTING_BUBBLE_BUTTON_ACTIVE_CLASS =
  "bg-zinc-800 text-white";

export const RICH_MESSAGE_FORMATTING_BUBBLE_ARROW_CLASS =
  "absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-zinc-900 dark:border-t-zinc-950";

/** Opacity ease for the selection formatting toolbar (Reveal). */
export const RICH_MESSAGE_FORMATTING_BUBBLE_REVEAL_DURATION_MS = 200;

export const RICH_MESSAGE_EDITOR_PLACEHOLDER = "Message here…";
