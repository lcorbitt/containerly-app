import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ReportMessage } from "@/types/database";
import {
  THREAD_IMPORTER_QUOTE_BG_CLASS,
  THREAD_IMPORTER_REPLY_BG_CLASS,
  THREAD_IMPORTER_REPLY_RING_CLASS,
  THREAD_IMPORTER_ROOT_BG_CLASS,
  THREAD_OWN_AVATAR_RING_CLASS,
  THREAD_OWN_HIGHLIGHT_REPLY_BG_CLASS,
  THREAD_OWN_HIGHLIGHT_ROOT_BG_CLASS,
  THREAD_MESSAGE_CARD_SHADOW_CLASS,
  THREAD_REPLY_CARD_SHADOW_CLASS,
  THREAD_TEAM_OWN_AVATAR_RING_CLASS,
  THREAD_TEAM_OWN_REPLY_BG_CLASS,
  THREAD_TEAM_OWN_ROOT_BG_CLASS,
  THREAD_TEAM_QUOTE_BG_CLASS,
  THREAD_TEAM_REPLY_BG_CLASS,
  THREAD_TEAM_REPLY_RING_CLASS,
  THREAD_TEAM_ROOT_BG_CLASS,
  THREAD_MESSAGE_ROW_CLASS,
  THREAD_MESSAGE_ROW_OWN_CLASS,
  THREAD_MESSAGE_BUBBLE_OWN_CLASS,
  THREAD_MESSAGE_BUBBLE_OTHER_CLASS,
  THREAD_MESSAGE_QUOTE_SHELL_OWN_CLASS,
  THREAD_MESSAGE_QUOTE_SHELL_OTHER_CLASS,
  THREAD_MESSAGE_CONTENT_PAD_OWN_CLASS,
  THREAD_MESSAGE_CONTENT_PAD_OTHER_CLASS,
  THREAD_MESSAGE_CORNER_ACTIONS_OWN_CLASS,
  THREAD_MESSAGE_CORNER_ACTIONS_OTHER_CLASS,
} from "./constants";

export function buildAuthorAvatarUrlByUserId(
  profileImagePathByUserId: Record<string, string | null | undefined>,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [userId, path] of Object.entries(profileImagePathByUserId)) {
    out[userId] = getProfileImagePublicUrlBrowser(path);
  }
  return out;
}

export function threadMessageAuthorAvatarUrl(
  message: ReportMessage,
  authorAvatarUrlByUserId: Record<string, string | null>,
): string | null {
  if (!message.author_user_id) return null;
  return authorAvatarUrlByUserId[message.author_user_id] ?? null;
}

/** Teammate (green) vs importer/customer (rose) lane for message chrome. */
export type ThreadMessagePalette = "team" | "customer";

export function threadMessagePalette(input: {
  authorKind: string;
}): ThreadMessagePalette {
  return input.authorKind === "customer" ? "customer" : "team";
}

export function threadMessageIsOwn(input: {
  currentUserId: string | null;
  authorUserId: string | null | undefined;
}): boolean {
  return Boolean(
    input.currentUserId && input.authorUserId && input.authorUserId === input.currentUserId,
  );
}

export function threadMessageQuoteClass(palette: ThreadMessagePalette): string {
  return palette === "team" ? THREAD_TEAM_QUOTE_BG_CLASS : THREAD_IMPORTER_QUOTE_BG_CLASS;
}

export function threadMessageReplyRingClass(palette: ThreadMessagePalette): string {
  return palette === "team" ? THREAD_TEAM_REPLY_RING_CLASS : THREAD_IMPORTER_REPLY_RING_CLASS;
}

export function threadMessageRowClass(isOwnMessage: boolean): string {
  return isOwnMessage ? THREAD_MESSAGE_ROW_OWN_CLASS : THREAD_MESSAGE_ROW_CLASS;
}

export function threadMessageBubbleClass(isOwnMessage: boolean): string {
  return isOwnMessage ? THREAD_MESSAGE_BUBBLE_OWN_CLASS : THREAD_MESSAGE_BUBBLE_OTHER_CLASS;
}

export function threadMessageQuoteShellClass(isOwnMessage: boolean): string {
  return isOwnMessage
    ? THREAD_MESSAGE_QUOTE_SHELL_OWN_CLASS
    : THREAD_MESSAGE_QUOTE_SHELL_OTHER_CLASS;
}

export function threadMessageContentPadClass(isOwnMessage: boolean): string {
  return isOwnMessage
    ? THREAD_MESSAGE_CONTENT_PAD_OWN_CLASS
    : THREAD_MESSAGE_CONTENT_PAD_OTHER_CLASS;
}

export function threadMessageCornerActionsClass(isOwnMessage: boolean): string {
  return isOwnMessage
    ? THREAD_MESSAGE_CORNER_ACTIONS_OWN_CLASS
    : THREAD_MESSAGE_CORNER_ACTIONS_OTHER_CLASS;
}

export function threadMessageShellClass({
  isRoot,
  palette,
  isOwnMessage,
  highlightOwnAsOperator,
}: {
  isRoot: boolean;
  palette: ThreadMessagePalette;
  isOwnMessage: boolean;
  /** Operator viewing their own message in a shared thread — sky-blue highlight. */
  highlightOwnAsOperator: boolean;
}): string {
  const shadow = isRoot ? THREAD_MESSAGE_CARD_SHADOW_CLASS : THREAD_REPLY_CARD_SHADOW_CLASS;
  const radius = isRoot ? "rounded-2xl" : "rounded-xl";

  let bg: string;
  if (isOwnMessage && highlightOwnAsOperator) {
    bg = isRoot ? THREAD_OWN_HIGHLIGHT_ROOT_BG_CLASS : THREAD_OWN_HIGHLIGHT_REPLY_BG_CLASS;
  } else if (isOwnMessage && palette === "team") {
    bg = isRoot ? THREAD_TEAM_OWN_ROOT_BG_CLASS : THREAD_TEAM_OWN_REPLY_BG_CLASS;
  } else if (isOwnMessage) {
    bg = isRoot ? THREAD_IMPORTER_ROOT_BG_CLASS : THREAD_IMPORTER_REPLY_BG_CLASS;
  } else if (palette === "team") {
    bg = isRoot ? THREAD_TEAM_ROOT_BG_CLASS : THREAD_TEAM_REPLY_BG_CLASS;
  } else {
    bg = isRoot ? THREAD_IMPORTER_ROOT_BG_CLASS : THREAD_IMPORTER_REPLY_BG_CLASS;
  }

  return `group/card ${radius} px-4 py-3 ${shadow} ${bg}`;
}

export function threadMessageAvatarClass({
  isOwnMessage,
  highlightOwnAsOperator,
  palette,
  baseClass,
}: {
  isOwnMessage: boolean;
  highlightOwnAsOperator: boolean;
  palette: ThreadMessagePalette;
  baseClass: string;
}): string {
  if (!isOwnMessage) return baseClass;
  const ring = highlightOwnAsOperator
    ? THREAD_OWN_AVATAR_RING_CLASS
    : palette === "team"
      ? THREAD_TEAM_OWN_AVATAR_RING_CLASS
      : baseClass;
  return ring === baseClass ? baseClass : `${baseClass} ${ring}`;
}

export function threadMessageAuthorHeadingClass({
  palette,
  isOwnMessage,
  highlightOwnAsOperator,
}: {
  palette: ThreadMessagePalette;
  isOwnMessage: boolean;
  highlightOwnAsOperator: boolean;
}): string {
  if (!isOwnMessage) {
    return palette === "customer"
      ? "text-sm font-semibold text-rose-950 dark:text-rose-100"
      : "text-sm font-semibold text-zinc-900 dark:text-zinc-50";
  }
  if (highlightOwnAsOperator) return "text-sm font-semibold text-sky-950 dark:text-sky-100";
  if (palette === "customer") return "text-sm font-semibold text-rose-950 dark:text-rose-100";
  return "text-sm font-semibold text-emerald-950 dark:text-emerald-100";
}

export function threadMessageAuthorName(
  m: ReportMessage,
  nameByUserId: Record<string, string>,
): string {
  if (m.author_kind === "system") return "System";
  if (m.author_kind === "customer") {
    if (m.author_user_id && nameByUserId[m.author_user_id]) {
      return nameByUserId[m.author_user_id]!;
    }
    return m.author_display_name?.trim() || "Importer";
  }
  if (m.author_user_id && nameByUserId[m.author_user_id]) {
    return nameByUserId[m.author_user_id]!;
  }
  const stored = m.author_display_name?.trim();
  if (stored) return stored;
  return "Team member";
}

export function threadMessageAuthorEmail(
  m: ReportMessage,
  emailByUserId: Record<string, string> | undefined,
): string | null {
  if (m.author_kind !== "customer") return null;
  const uid = m.author_user_id;
  if (!uid) return null;
  const email = emailByUserId?.[uid]?.trim();
  return email || null;
}

export function scrollThreadToLatest(
  container: HTMLElement | null,
  _anchor: HTMLElement | null,
  behavior: ScrollBehavior = "auto",
): void {
  if (!container) return;
  const top = Math.max(0, container.scrollHeight - container.clientHeight);
  container.scrollTo({ top, behavior });
}

/** Scroll the page so the tabs card and composer are in view (`?tab=messages`). */
export function scrollMessagesTabChromeIntoView(
  behavior: ScrollBehavior = "auto",
  opts?: { composerId?: string; tabsSectionId?: string },
): void {
  const composerId = opts?.composerId ?? "workspace-thread-composer";
  const tabsSectionId = opts?.tabsSectionId ?? "shipment-workspace-tabs";
  const target =
    document.getElementById(composerId) ?? document.getElementById(tabsSectionId);
  if (!target) return;
  target.scrollIntoView({ block: "end", behavior, inline: "nearest" });
}

function runFlushSteps(run: () => void): void {
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  window.setTimeout(run, 50);
  window.setTimeout(run, 350);
  window.setTimeout(run, 550);
}

/** Re-run scroll after layout, Reveal transitions (500ms), and late-resizing content. */
export function flushScrollThreadToLatest(
  container: HTMLElement | null,
  anchor: HTMLElement | null,
  behavior: ScrollBehavior = "auto",
): void {
  runFlushSteps(() => scrollThreadToLatest(container, anchor, behavior));
}

export function flushScrollMessagesTabChromeIntoView(
  behavior: ScrollBehavior = "auto",
  opts?: { composerId?: string; tabsSectionId?: string },
): void {
  runFlushSteps(() => scrollMessagesTabChromeIntoView(behavior, opts));
}
