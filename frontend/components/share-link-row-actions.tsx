"use client";

import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirm } from "@/contexts/confirm-dialog";

const ICON_BTN =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800";

function InlineSpinner() {
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

export function ShareLinkRowActions({
  shareId,
  url,
  onDelete,
  onToast,
}: {
  shareId: string;
  url: string;
  onDelete: (id: string) => Promise<void>;
  onToast: (message: string, variant: "success" | "error" | "info") => void;
}) {
  const { confirm } = useConfirm();
  const [copyPhase, setCopyPhase] = useState<"idle" | "busy" | "done">("idle");
  const [deleting, setDeleting] = useState(false);
  const copyReset = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopyTimer = useCallback(() => {
    if (copyReset.current) {
      clearTimeout(copyReset.current);
      copyReset.current = null;
    }
  }, []);

  useEffect(() => () => clearCopyTimer(), [clearCopyTimer]);

  async function handleCopy() {
    clearCopyTimer();
    setCopyPhase("busy");
    try {
      await navigator.clipboard.writeText(url);
      setCopyPhase("done");
      onToast("Link copied to clipboard", "success");
      copyReset.current = setTimeout(() => setCopyPhase("idle"), 2000);
    } catch {
      setCopyPhase("idle");
      onToast("Could not copy — try again or copy manually", "error");
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete customer link?",
      description:
        "This permanently removes the link. The URL will stop working and cannot be recovered.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await onDelete(shareId);
      onToast("Link deleted", "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Could not delete link", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${ICON_BTN} border-zinc-200 bg-white dark:border-zinc-700`}
        title="Open customer report in a new tab"
        aria-label="Open customer report in a new tab"
      >
        <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden />
      </a>
      <button
        type="button"
        disabled={copyPhase === "busy"}
        onClick={() => void handleCopy()}
        className={`${ICON_BTN} border-zinc-200 bg-white dark:border-zinc-700`}
        title="Copy link to clipboard"
        aria-label="Copy link to clipboard"
      >
        {copyPhase === "busy" ? (
          <InlineSpinner />
        ) : copyPhase === "done" ? (
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} aria-hidden />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => void handleDelete()}
        className={`${ICON_BTN} border-red-200 bg-red-50/80 text-red-900 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/70`}
        title="Delete link permanently"
        aria-label="Delete link permanently"
      >
        {deleting ? <InlineSpinner /> : <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />}
      </button>
    </div>
  );
}
