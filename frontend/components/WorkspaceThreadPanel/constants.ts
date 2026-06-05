/** Signed-in operator — own messages (sky blue). */
export const THREAD_OWN_ROOT_BG_CLASS = "bg-sky-100 dark:bg-sky-950/55";
export const THREAD_OWN_REPLY_BG_CLASS = "bg-sky-100 dark:bg-sky-950/48";
export const THREAD_OWN_HIGHLIGHT_ROOT_BG_CLASS =
  "border-r-[3px] border-sky-400/75 bg-sky-200/90 dark:border-sky-500/55 dark:bg-sky-900/62";
export const THREAD_OWN_HIGHLIGHT_REPLY_BG_CLASS =
  "border-r-[3px] border-sky-400/65 bg-sky-200/80 dark:border-sky-500/48 dark:bg-sky-900/55";
export const THREAD_OWN_AVATAR_RING_CLASS =
  "ring-2 ring-sky-400/40 ring-offset-2 ring-offset-zinc-50 dark:ring-sky-500/35 dark:ring-offset-zinc-950";
export const THREAD_OWN_COMPOSER_BG_CLASS =
  "rounded-2xl bg-sky-100 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-sky-400/40 dark:bg-sky-950/55 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:focus-within:ring-sky-500/35";
export const THREAD_OWN_REPLY_RING_CLASS =
  "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-sky-100 dark:ring-sky-500/35 dark:ring-offset-sky-950";

/** Teammates — other org operators (emerald green). */
export const THREAD_TEAM_ROOT_BG_CLASS = "bg-emerald-100 dark:bg-emerald-950/55";
export const THREAD_TEAM_REPLY_BG_CLASS = "bg-emerald-100 dark:bg-emerald-950/48";
export const THREAD_TEAM_OWN_ROOT_BG_CLASS =
  "border-r-[3px] border-emerald-500/70 bg-emerald-200/85 dark:border-emerald-500/50 dark:bg-emerald-900/58";
export const THREAD_TEAM_OWN_REPLY_BG_CLASS =
  "border-r-[3px] border-emerald-500/60 bg-emerald-200/75 dark:border-emerald-500/45 dark:bg-emerald-900/52";
export const THREAD_TEAM_OWN_AVATAR_RING_CLASS =
  "ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-zinc-50 dark:ring-emerald-500/35 dark:ring-offset-zinc-950";
export const THREAD_TEAM_QUOTE_BG_CLASS =
  "border-emerald-400/90 bg-emerald-200/80 py-1.5 dark:border-emerald-500/70 dark:bg-emerald-900/55";
export const THREAD_TEAM_REPLY_RING_CLASS =
  "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-emerald-100 dark:ring-emerald-500/35 dark:ring-offset-emerald-950";

/** Importer / customer portal authors (rose / maroon). */
export const THREAD_IMPORTER_ROOT_BG_CLASS = "bg-rose-100 dark:bg-rose-950/55";
export const THREAD_IMPORTER_REPLY_BG_CLASS = "bg-rose-100 dark:bg-rose-950/48";
export const THREAD_IMPORTER_QUOTE_BG_CLASS =
  "border-rose-400/90 bg-rose-200/85 py-1.5 dark:border-rose-500/70 dark:bg-rose-900/55";
export const THREAD_IMPORTER_REPLY_RING_CLASS =
  "ring-2 ring-rose-400/45 ring-offset-2 ring-offset-rose-100 dark:ring-rose-500/35 dark:ring-offset-rose-950";

export const THREAD_MESSAGE_ROW_CLASS = "flex w-full items-center gap-3";

export const THREAD_MESSAGE_ROW_OWN_CLASS = "flex w-full items-center justify-end gap-3";

export const THREAD_MESSAGE_BUBBLE_MAX_WIDTH_CLASS = "max-w-[min(100%,28rem)]";

export const THREAD_MESSAGE_BUBBLE_CLASS =
  `relative min-w-0 w-fit ${THREAD_MESSAGE_BUBBLE_MAX_WIDTH_CLASS} text-sm`;

export const THREAD_MESSAGE_QUOTE_SHELL_CLASS =
  "mb-3 border-l-[3px] pl-3 pr-25 rounded-r-md";

export const THREAD_MESSAGE_CONTENT_PAD_CLASS = "min-w-0";

/** Extra bottom space while inline-editing so save/cancel icons sit clear of the editor. */
export const THREAD_MESSAGE_CONTENT_PAD_EDITING_CLASS = "pb-8";

export const THREAD_MESSAGE_CORNER_ACTIONS_CLASS =
  "absolute top-0 right-1 z-10 flex items-center gap-0.5 rounded-md bg-transparent p-0.5 backdrop-blur-[2px] opacity-0 transition-opacity duration-200 ease-out group-hover/card:opacity-100 focus-within:opacity-100";

export const THREAD_MESSAGE_EDIT_ACTIONS_CLASS =
  "absolute bottom-1 right-1 z-10 flex items-center gap-0.5 rounded-md bg-transparent p-0.5 backdrop-blur-[2px]";

/** Reply / edit — dark icon on hover in light mode (readable on pastel bubbles). */
export const THREAD_MESSAGE_CORNER_ACTION_REPLY_EDIT_CLASS =
  "group/msg-act inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors duration-200 ease-out hover:bg-zinc-900/10 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50";

export const THREAD_MESSAGE_CORNER_ACTION_DELETE_CLASS =
  "group/msg-act inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors duration-200 ease-out hover:bg-red-950/10 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-red-600 dark:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-200 dark:disabled:hover:text-red-500";

export const THREAD_MESSAGE_CORNER_ACTION_ICON_CLASS =
  "h-4 w-4 shrink-0 transition-[transform,color] duration-200 ease-out group-hover/msg-act:scale-[1.14]";

export const THREAD_MESSAGE_AVATAR_CLASS = "shrink-0";

export const THREAD_MESSAGE_TIMESTAMP_CLASS =
  "shrink-0 text-[10px] tabular-nums leading-snug text-zinc-400 dark:text-zinc-500";

export const THREAD_MESSAGE_AUTHOR_ROW_CLASS =
  "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5";

export const THREAD_MESSAGE_AUTHOR_EMAIL_CLASS =
  "mt-0.5 min-w-0 truncate text-[10px] leading-snug text-zinc-500 dark:text-zinc-400";

/** Scroll target for page-level focus when opening the messages tab (composer footer). */
export const THREAD_PANEL_COMPOSER_ID = "workspace-thread-composer";

export const THREAD_MESSAGE_CARD_SHADOW_CLASS =
  "shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]";
export const THREAD_REPLY_CARD_SHADOW_CLASS =
  "shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)]";
