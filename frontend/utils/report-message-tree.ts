export type ThreadNode<T extends { id: string; parent_message_id: string | null; created_at: string }> = T & {
  children: ThreadNode<T>[];
};

/** All message ids in the subtree rooted at `rootId` (including `rootId`), using parent links in `flat`. */
export function collectMessageSubtreeIds<
  T extends { id: string; parent_message_id: string | null },
>(flat: T[], rootId: string): Set<string> {
  const byParent = new Map<string | null, string[]>();
  for (const m of flat) {
    const pid = m.parent_message_id;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(m.id);
  }
  const out = new Set<string>();
  const stack: string[] = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const cid of byParent.get(id) ?? []) stack.push(cid);
  }
  return out;
}

/** Build a tree from a flat list; parents not in `flat` are treated as roots. */
export function buildMessageTree<
  T extends { id: string; parent_message_id: string | null; created_at: string },
>(flat: T[]): ThreadNode<T>[] {
  const ids = new Set(flat.map((m) => m.id));
  const byId = new Map<string, ThreadNode<T>>();
  for (const m of flat) {
    byId.set(m.id, { ...m, children: [] });
  }
  const roots: ThreadNode<T>[] = [];
  for (const m of flat) {
    const node = byId.get(m.id)!;
    const pid = m.parent_message_id;
    if (pid && ids.has(pid)) {
      byId.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortChildren = (nodes: ThreadNode<T>[]) => {
    nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const n of nodes) sortChildren(n.children);
  };
  sortChildren(roots);
  return roots;
}

/** Collapse whitespace and truncate for inline reply-reference preview (Discord-style). */
export function truncatedReplyPreview(text: string, maxLen = 72): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "…";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export { formatTimestamp } from "@/utils/datetime";
