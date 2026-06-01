import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ReportMessage } from "@/types/database";
import {
  THREAD_CUSTOMER_OWN_AVATAR_RING_CLASS,
  THREAD_CUSTOMER_OWN_REPLY_BG_CLASS,
  THREAD_CUSTOMER_OWN_ROOT_BG_CLASS,
  THREAD_CUSTOMER_REPLY_BG_CLASS,
  THREAD_CUSTOMER_ROOT_BG_CLASS,
  THREAD_INTERNAL_OWN_AVATAR_RING_CLASS,
  THREAD_INTERNAL_OWN_REPLY_BG_CLASS,
  THREAD_INTERNAL_OWN_ROOT_BG_CLASS,
  THREAD_INTERNAL_REPLY_BG_CLASS,
  THREAD_INTERNAL_ROOT_BG_CLASS,
  THREAD_MESSAGE_CARD_SHADOW_CLASS,
  THREAD_REPLY_CARD_SHADOW_CLASS,
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

export function threadMessageShellClass({
  isRoot,
  isInternal,
  isOwnMessage,
}: {
  isRoot: boolean;
  isInternal: boolean;
  isOwnMessage: boolean;
}): string {
  const shadow = isRoot ? THREAD_MESSAGE_CARD_SHADOW_CLASS : THREAD_REPLY_CARD_SHADOW_CLASS;
  const radius = isRoot ? "rounded-2xl" : "rounded-xl";

  let bg: string;
  if (isInternal) {
    if (isOwnMessage) {
      bg = isRoot ? THREAD_INTERNAL_OWN_ROOT_BG_CLASS : THREAD_INTERNAL_OWN_REPLY_BG_CLASS;
    } else {
      bg = isRoot ? THREAD_INTERNAL_ROOT_BG_CLASS : THREAD_INTERNAL_REPLY_BG_CLASS;
    }
  } else if (isOwnMessage) {
    bg = isRoot ? THREAD_CUSTOMER_OWN_ROOT_BG_CLASS : THREAD_CUSTOMER_OWN_REPLY_BG_CLASS;
  } else {
    bg = isRoot ? THREAD_CUSTOMER_ROOT_BG_CLASS : THREAD_CUSTOMER_REPLY_BG_CLASS;
  }

  return `group/card ${radius} px-4 py-3 ${shadow} ${bg}`;
}

export function threadMessageAvatarClass({
  isInternal,
  isOwnMessage,
  baseClass,
}: {
  isInternal: boolean;
  isOwnMessage: boolean;
  baseClass: string;
}): string {
  if (!isOwnMessage) return baseClass;
  const ring = isInternal ? THREAD_INTERNAL_OWN_AVATAR_RING_CLASS : THREAD_CUSTOMER_OWN_AVATAR_RING_CLASS;
  return `${baseClass} ${ring}`;
}

export function threadMessageAuthorHeadingClass({
  isInternal,
  isOwnMessage,
}: {
  isInternal: boolean;
  isOwnMessage: boolean;
}): string {
  if (!isOwnMessage) return "text-sm font-semibold text-zinc-900 dark:text-zinc-50";
  if (isInternal) return "text-sm font-semibold text-emerald-950 dark:text-emerald-100";
  return "text-sm font-semibold text-sky-950 dark:text-sky-100";
}

export function threadMessageAuthorName(
  m: ReportMessage,
  nameByUserId: Record<string, string>,
): string {
  if (m.author_kind === "system") return "System";
  if (m.author_kind === "customer") return m.author_display_name?.trim() || "Importer";
  const stored = m.author_display_name?.trim();
  if (stored) return stored;
  if (m.author_user_id && nameByUserId[m.author_user_id]) return nameByUserId[m.author_user_id]!;
  return "Team member";
}
