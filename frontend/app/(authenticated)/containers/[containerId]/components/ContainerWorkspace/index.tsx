"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowRight, FileText, Map as MapIcon, MapPin, MessageSquare, Route } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReportActivityList } from "@/components/report-activity-list";
import { ContainerDetailsModal } from "@/components/container-details-modal";
import { VesselEnrichmentCard } from "@/components/vessel-enrichment-card";
import { ShipmentTrackingMapPanel } from "@/components/shipment-tracking-map";
import { DocumentsList } from "@/components/documents-list";
import { ThreadPanel } from "@/components/workspace-thread-panel";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/workspace-files";
import { PageLoading } from "@/components/page-loading";
import { getBrowserAuthUserId } from "@/services/auth-browser.service";
import {
  deleteContainerReportMessage,
  loadContainerWorkspaceData,
  openContainerWorkspaceAttachmentSignedUrl,
  postContainerWorkspaceMessage,
  removeContainerWorkspaceAttachment,
  renameContainerWorkspaceAttachment,
  type ContainerWorkspaceSnapshot,
  uploadContainerWorkspaceDocuments,
} from "@/services/container-workspace.service";
import { useConfirm } from "@/contexts/confirm-dialog";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import {
  ContainerTimelineView,
  formatTimelineWhen,
  TimelineOrderToggle,
  useContainerTimelineOrder,
} from "@/components/container-timeline";
import { CarrierReportedStatusPill, TrackingWorkflowStatusPill } from "@/components/status-pills";
import { computePublicReportInsights, riskInsightBadgeClass } from "@/lib/report-insights";
import { getShipmentDetailRows, shipperReceiverFromLocation } from "@/lib/jsoncargo-display";
import { formatTimestamp } from "@/utils/datetime";
import { WORKSPACE_TAB_PANEL_HEIGHT_CSS, workspaceTabButtonClass } from "@/lib/workspace-tab-panel";
import { collectMessageSubtreeIds } from "@/lib/report-message-tree";
import type { ReportActivity, ReportMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

type MainTab = "timeline" | "thread" | "documents";

type MessageChannel = "team" | "customer";

type TrackingSubview = "timeline" | "map";

function trackingSubviewToggleClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
  }`;
}

export function ContainerWorkspace({
  containerId,
  shipmentEmbed,
}: {
  containerId: string;
  /** When set, sibling lines on this shipment switch via callback (shipment page) instead of `/containers/…`. */
  shipmentEmbed?: { onSelectContainer: (containerId: string) => void };
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [request, setRequest] = useState<TrackingRequest | null>(null);
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [messageAuthorByUserId, setMessageAuthorByUserId] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<ReportActivity[]>([]);
  const [timeline, setTimeline] = useState<PublicTimelineEvent[]>([]);
  const timelineOrder = useContainerTimelineOrder(timeline);
  const [containerRow, setContainerRow] = useState<ContainerWorkspaceSnapshot | null>(null);
  const [bolGroupSiblings, setBolGroupSiblings] = useState<
    { id: string; container_number: string }[]
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [messageChannel, setMessageChannel] = useState<MessageChannel>("team");
  const [docChannel, setDocChannel] = useState<MessageChannel>("team");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("timeline");
  const [trackingSubview, setTrackingSubview] = useState<TrackingSubview>("timeline");
  const [containerDetailsModalOpen, setContainerDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<WorkspaceAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<string | null>(null);
  const [composerPendingFiles, setComposerPendingFiles] = useState<File[]>([]);

  const attachmentsByMessageId = useMemo(() => {
    const m = new Map<string, WorkspaceAttachment[]>();
    for (const a of attachments) {
      const mid = a.report_message_id;
      if (!mid) continue;
      const cur = m.get(mid) ?? [];
      cur.push(a);
      m.set(mid, cur);
    }
    for (const list of m.values()) {
      list.sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
    }
    return m;
  }, [attachments]);

  const onComposerPickFiles = useCallback(
    (files: FileList | null) => {
      const raw = files ? Array.from(files) : [];
      if (!raw.length) return;

      setComposerPendingFiles((prev) => {
        const room = Math.max(0, MAX_ATTACHMENTS_PER_MESSAGE - prev.length);
        if (room === 0) {
          queueMicrotask(() =>
            toast(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`, "info"),
          );
          return prev;
        }

        const accepted: File[] = [];
        let oversized = 0;
        for (const f of raw) {
          if (f.size > MAX_ATTACHMENT_FILE_BYTES) {
            oversized += 1;
            continue;
          }
          if (accepted.length < room) accepted.push(f);
        }

        const eligible = raw.filter((f) => f.size <= MAX_ATTACHMENT_FILE_BYTES);
        const skippedForCap = eligible.length - accepted.length;

        queueMicrotask(() => {
          if (oversized > 0) {
            toast(
              oversized === 1
                ? `That file exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`
                : `${oversized} files exceed the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`,
              "error",
            );
          }
          if (skippedForCap > 0) {
            toast(
              `Only ${MAX_ATTACHMENTS_PER_MESSAGE} files per message. ${skippedForCap} file(s) were not added.`,
              "info",
            );
          }
        });

        if (accepted.length === 0) return prev;
        return [...prev, ...accepted];
      });
    },
    [toast],
  );

  const onRemoveComposerPendingFile = useCallback((index: number) => {
    setComposerPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      const quiet = opts?.quiet ?? false;
      if (!selectedOrgId) return;
      setLoadError(null);
      if (!quiet) setLoading(true);
      try {
        const result = await loadContainerWorkspaceData({
          containerId,
          organizationId: selectedOrgId,
        });
        if (!result.ok) {
          setRequest(null);
          setContainerRow(null);
          setBolGroupSiblings([]);
          setMessages([]);
          setActivity([]);
          setTimeline([]);
          setAttachments([]);
          setMessageAuthorByUserId({});
          setLoadError(result.error);
          return;
        }

        setRequest(result.request);
        setMessages(result.messages);
        setMessageAuthorByUserId(result.messageAuthorByUserId);
        setActivity(result.activity);
        setTimeline(result.timeline);
        setAttachments(result.attachments);
        if (result.quietAttachmentWarning && !quiet) {
          toast(`Could not load attachments: ${result.quietAttachmentWarning}`, "error");
        }
        setContainerRow(result.containerRow);
        setBolGroupSiblings(result.bolGroupSiblings);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [containerId, selectedOrgId, toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void getBrowserAuthUserId().then(setCurrentUserId);
  }, []);

  const internalOnlyComposer = messageChannel === "team";

  const filteredThreadMessages = useMemo(
    () => messages.filter((m) => (messageChannel === "team" ? m.is_internal : !m.is_internal)),
    [messages, messageChannel],
  );

  useEffect(() => {
    if (!replyParentId) return;
    const ok = filteredThreadMessages.some((m) => m.id === replyParentId);
    if (!ok) setReplyParentId(null);
  }, [filteredThreadMessages, replyParentId]);

  const shipmentLoc = (containerRow?.location as Record<string, unknown> | null) ?? null;
  const carrierDetailRows = useMemo(() => getShipmentDetailRows(shipmentLoc), [shipmentLoc]);
  const shipperReceiver = useMemo(() => shipperReceiverFromLocation(shipmentLoc), [shipmentLoc]);
  const billOfLading = useMemo(() => {
    if (!shipmentLoc || typeof shipmentLoc !== "object") return "";
    const v = (shipmentLoc as Record<string, unknown>).bill_of_lading;
    return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
  }, [shipmentLoc]);

  /** Newest uploads first (matches `.order("created_at", { ascending: false })` from load). */
  const attachmentsNewestFirst = useMemo(() => {
    const scope = attachments.filter((a) => (docChannel === "team" ? a.is_internal : !a.is_internal));
    return scope.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [attachments, docChannel]);

  const requestSummaryData = useMemo(() => {
    if (!request) return null;
    const carrierReportedStatus = containerRow?.status ?? request.status;
    const lastSyncedAt = containerRow?.last_synced_at ?? request.last_sync_at;
    const insights = computePublicReportInsights({ carrierReportedStatus, lastSyncedAt });
    const loc = containerRow?.location;
    const lastKnown =
      loc && typeof loc === "object"
        ? ((loc as Record<string, unknown>).last_location ??
            (loc as Record<string, unknown>).discharging_port ??
            (loc as Record<string, unknown>).loading_port ??
            null)
        : null;
    const freshText =
      insights.freshness_minutes != null
        ? insights.freshness_minutes < 120
          ? `${insights.freshness_minutes} min ago`
          : `${Math.round(insights.freshness_minutes / 60)} h ago`
        : "unknown";
    return { insights, lastKnown, freshText, carrier: containerRow?.carrier ?? null };
  }, [request, containerRow]);

  async function deleteMessage(messageId: string) {
    const ok = await confirm({
      title: "Delete?",
      description:
        "This permanently removes the message. Any replies nested under it will be removed as well.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setDeletingMessageId(messageId);
    const idsToRemove = collectMessageSubtreeIds(messages, messageId);
    try {
      await deleteContainerReportMessage({ messageId });
      setReplyParentId((prev) => (prev && idsToRemove.has(prev) ? null : prev));
      setMessages((prev) => prev.filter((m) => !idsToRemove.has(m.id)));
      await load({ quiet: true });
      toast("Message deleted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete message", "error");
    } finally {
      setDeletingMessageId(null);
    }
  }

  async function postMessage() {
    const t = body.trim();
    const files = [...composerPendingFiles];
    if (!t && files.length === 0) return;
    if (!selectedOrgId) return;
    if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      toast(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`, "info");
      return;
    }
    for (const f of files) {
      if (f.size > MAX_ATTACHMENT_FILE_BYTES) {
        toast(`“${f.name}” exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`, "error");
        return;
      }
    }
    setPosting(true);
    try {
      const { attachmentErrors } = await postContainerWorkspaceMessage({
        containerId,
        organizationId: selectedOrgId,
        body: t,
        internalOnly: internalOnlyComposer,
        replyParentId,
        files,
      });
      for (const msg of attachmentErrors) {
        toast(msg, "error");
      }

      setBody("");
      setComposerPendingFiles([]);
      setReplyParentId(null);
      await load({ quiet: true });
      toast(internalOnlyComposer ? "Internal note posted" : "Message posted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post message", "error");
    } finally {
      setPosting(false);
    }
  }

  const openAttachment = useCallback(
    async (row: WorkspaceAttachment) => {
      try {
        const url = await openContainerWorkspaceAttachmentSignedUrl(row.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not open file", "error");
      }
    },
    [toast],
  );

  async function pickAttachmentFiles(files: FileList | null) {
    // Snapshot immediately: DocumentsList clears the input (`value=""`) right after onChange,
    // which empties the FileList before any await — so we must copy File refs synchronously.
    const queue = files ? Array.from(files) : [];
    if (!queue.length || !selectedOrgId) return;
    setUploadingAttachments(true);
    let uploadedCount = 0;
    try {
      const { inserted, errors } = await uploadContainerWorkspaceDocuments({
        organizationId: selectedOrgId,
        containerId,
        files: queue,
        isInternal: docChannel === "team",
      });
      for (const err of errors) {
        toast(err, "error");
      }
      uploadedCount = inserted.length;
      for (const row of inserted) {
        setAttachments((prev) => [row, ...prev]);
      }
      if (uploadedCount === 0) {
        toast("No files were uploaded.", "info");
        return;
      }
      await load({ quiet: true });
      toast(uploadedCount === 1 ? "File uploaded" : `${uploadedCount} files uploaded`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      if (msg === "Not signed in") {
        toast("Sign in to upload files.", "error");
      } else {
        toast(msg, "error");
      }
    } finally {
      setUploadingAttachments(false);
    }
  }

  const renameAttachment = useCallback(
    async (attachmentId: string, rawName: string) => {
      const trimmed = rawName.trim();
      if (!trimmed) {
        toast("Enter a file name.", "error");
        throw new Error("empty name");
      }
      if (trimmed.length > ATTACHMENT_DISPLAY_NAME_MAX_LEN) {
        toast(`File name is too long (max ${ATTACHMENT_DISPLAY_NAME_MAX_LEN} characters).`, "error");
        throw new Error("name too long");
      }
      const row = attachments.find((a) => a.id === attachmentId);
      if (!row) {
        throw new Error("Attachment not found");
      }
      if (row.file_name === trimmed) {
        return;
      }
      setRenamingAttachmentId(attachmentId);
      try {
        await renameContainerWorkspaceAttachment({ attachmentId, fileName: trimmed });
        setAttachments((prev) =>
          prev.map((a) => (a.id === attachmentId ? { ...a, file_name: trimmed } : a)),
        );
        toast("File name updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not rename file", "error");
        throw e;
      } finally {
        setRenamingAttachmentId(null);
      }
    },
    [attachments, toast],
  );

  async function removeAttachment(attachmentId: string) {
    const row = attachments.find((a) => a.id === attachmentId);
    if (!row) return;
    if (currentUserId && row.uploaded_by !== currentUserId) {
      toast("Only the person who uploaded the file can remove it.", "error");
      return;
    }
    const ok = await confirm({
      title: "Remove file?",
      description: `Permanently delete “${row.file_name}” from this request?`,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setRemovingAttachmentId(attachmentId);
    try {
      const { storageCleanupIncomplete } = await removeContainerWorkspaceAttachment({
        attachmentId,
        storagePath: row.storage_path,
      });
      if (storageCleanupIncomplete) {
        toast("File removed from the list; storage cleanup may be incomplete.", "info");
      }
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast("File removed", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove file", "error");
    } finally {
      setRemovingAttachmentId(null);
    }
  }

  if (!selectedOrgId) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this request.
      </p>
    );
  }

  if (loadError && !request) {
    return (
      <div className="p-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <Link href="/shipments" className="mt-4 inline-block text-sm font-medium underline">
          Back to shipments
        </Link>
      </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto box-border flex min-h-0 w-full max-w-6xl flex-1 flex-col p-6">
        <PageLoading loadingText="Loading request…" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const lastSyncLabel =
    request.last_sync_at != null
      ? formatTimelineWhen(request.last_sync_at)
      : containerRow?.last_synced_at != null
        ? formatTimelineWhen(containerRow.last_synced_at)
        : null;

  const carrierLastSyncedDisplay =
    containerRow?.last_synced_at != null
      ? formatTimestamp(containerRow.last_synced_at)
      : request.last_sync_at != null
        ? formatTimestamp(request.last_sync_at)
        : null;

  const carrierLastKnownDisplay =
    requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : null;

  return (
    <div className="mx-auto box-border flex w-full max-w-6xl flex-col p-6">
      <header className="mb-6 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {containerRow?.shipment_id && !shipmentEmbed ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  <Link
                    href={`/shipments/${containerRow.shipment_id}`}
                    className="font-medium text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300 dark:decoration-emerald-300/40"
                  >
                    Shipment workspace
                  </Link>
                  <span className="text-zinc-400 dark:text-zinc-500"> · </span>
                  <span className="text-zinc-500 dark:text-zinc-400">container line</span>
                </p>
              ) : null}
              {shipmentEmbed ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Container line on this shipment</p>
              ) : null}
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Container
              </p>
              <h1 className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                #{request.container_number}
              </h1>
              {request.source_bill_of_lading?.trim() ? (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Bill of lading</span>{" "}
                  <span className="font-mono">{request.source_bill_of_lading.trim()}</span>
                </p>
              ) : null}
              {bolGroupSiblings.length > 0 ? (
                <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/50">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Other containers on this shipment
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {bolGroupSiblings.map((s) => (
                      <li key={s.id}>
                        {shipmentEmbed ? (
                          <button
                            type="button"
                            onClick={() => shipmentEmbed.onSelectContainer(s.id)}
                            className="font-mono text-sm font-medium text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300 dark:decoration-emerald-300/40 dark:hover:decoration-emerald-300"
                          >
                            #{s.container_number}
                          </button>
                        ) : (
                          <Link
                            href={`/containers/${s.id}`}
                            className="font-mono text-sm font-medium text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300 dark:decoration-emerald-300/40 dark:hover:decoration-emerald-300"
                          >
                            #{s.container_number}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TrackingWorkflowStatusPill status={request.status} />
                {requestSummaryData ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskInsightBadgeClass(requestSummaryData.insights.risk_level)}`}
                  >
                    {requestSummaryData.insights.risk_level.toUpperCase()} risk
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:items-end">
              <div className="flex min-w-0 max-w-full flex-nowrap items-center gap-2 text-sm font-medium sm:max-w-2xl sm:justify-end">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                {shipperReceiver.shipper || shipperReceiver.receiver ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-zinc-800 sm:text-right dark:text-zinc-200">
                      {shipperReceiver.shipper ?? "—"}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-zinc-800 sm:text-right dark:text-zinc-200">
                      {shipperReceiver.receiver ?? "—"}
                    </span>
                  </>
                ) : requestSummaryData?.lastKnown != null ? (
                  <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">
                    {String(requestSummaryData.lastKnown)}
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">Route not available yet</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 sm:items-end">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Last updated {lastSyncLabel ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch">
        <div className="flex min-w-0 flex-col">
          <div
            className="flex w-full shrink-0 overflow-x-auto"
            role="tablist"
            aria-label="Request workspace"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "timeline"}
              className={workspaceTabButtonClass(mainTab === "timeline")}
              onClick={() => setMainTab("timeline")}
            >
              <Route className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Tracking
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "thread"}
              className={workspaceTabButtonClass(mainTab === "thread")}
              onClick={() => setMainTab("thread")}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              {shipmentEmbed ? "Container messages" : "Messages"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "documents"}
              className={workspaceTabButtonClass(mainTab === "documents")}
              onClick={() => setMainTab("documents")}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              {shipmentEmbed ? "Container files" : "Documents"}
            </button>
          </div>
          <div
            className="flex min-h-0 flex-col overflow-hidden rounded-b-xl rounded-t-none border border-t-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            role="tabpanel"
            style={{ height: WORKSPACE_TAB_PANEL_HEIGHT_CSS }}
          >
            {mainTab === "timeline" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-2.5 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950"
                  role="toolbar"
                  aria-label="Tracking view"
                >
                  <div
                    className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50/90 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/60"
                    role="group"
                    aria-label="Switch timeline or map"
                  >
                    <button
                      type="button"
                      className={trackingSubviewToggleClass(trackingSubview === "timeline")}
                      aria-pressed={trackingSubview === "timeline"}
                      onClick={() => setTrackingSubview("timeline")}
                    >
                      <Route className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
                      Timeline
                    </button>
                    <button
                      type="button"
                      className={trackingSubviewToggleClass(trackingSubview === "map")}
                      aria-pressed={trackingSubview === "map"}
                      onClick={() => setTrackingSubview("map")}
                    >
                      <MapIcon className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
                      Map
                    </button>
                  </div>
                  {trackingSubview === "timeline" && timeline.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <TimelineOrderToggle
                        newestFirst={timelineOrder.newestFirst}
                        onToggle={timelineOrder.handleOrderToggle}
                      />
                    </div>
                  ) : null}
                </div>
                {trackingSubview === "timeline" ? (
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                    <ContainerTimelineView
                      events={timeline}
                      order={timelineOrder}
                      hideHeader
                      showOrderToggle={false}
                      className="shadow-none!"
                    />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                    <ShipmentTrackingMapPanel location={shipmentLoc} headingId="workspace-map-heading" />
                  </div>
                )}
              </div>
            ) : null}
            {mainTab === "thread" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                  role="tablist"
                  aria-label="Message audience"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={messageChannel === "team"}
                    className={trackingSubviewToggleClass(messageChannel === "team")}
                    onClick={() => setMessageChannel("team")}
                  >
                    Team only
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={messageChannel === "customer"}
                    className={trackingSubviewToggleClass(messageChannel === "customer")}
                    onClick={() => setMessageChannel("customer")}
                  >
                    Customer portal
                  </button>
                </div>
                <ThreadPanel
                  messages={filteredThreadMessages}
                  authorNameByUserId={messageAuthorByUserId}
                  uploaderDisplayByUserId={messageAuthorByUserId}
                  attachmentsByMessageId={attachmentsByMessageId}
                  onOpenAttachment={(row) => void openAttachment(row)}
                  onRenameAttachment={(id, name) => renameAttachment(id, name)}
                  renamingAttachmentId={renamingAttachmentId}
                  composerPendingFiles={composerPendingFiles}
                  onComposerPickFiles={onComposerPickFiles}
                  onRemoveComposerPendingFile={onRemoveComposerPendingFile}
                  body={body}
                  onBodyChange={setBody}
                  internalOnly={internalOnlyComposer}
                  onInternalOnlyChange={() => {}}
                  showInternalComposerToggle={false}
                  posting={posting}
                  onPostMessage={() => void postMessage()}
                  replyParentId={replyParentId}
                  onReplyParent={setReplyParentId}
                  onClearReplyParent={() => setReplyParentId(null)}
                  currentUserId={currentUserId}
                  onDeleteMessage={(id) => void deleteMessage(id)}
                  deletingMessageId={deletingMessageId}
                  composerAuthorLabel={
                    currentUserId && messageAuthorByUserId[currentUserId]
                      ? messageAuthorByUserId[currentUserId]!
                      : ""
                  }
                  emptyStateText={
                    messageChannel === "team"
                      ? shipmentEmbed
                        ? "No team messages on this container yet."
                        : "No team messages yet."
                      : "No customer-visible messages on this container yet."
                  }
                />
              </div>
            ) : null}
            {mainTab === "documents" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                  role="tablist"
                  aria-label="Document visibility"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={docChannel === "team"}
                    className={trackingSubviewToggleClass(docChannel === "team")}
                    onClick={() => setDocChannel("team")}
                  >
                    Team files
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={docChannel === "customer"}
                    className={trackingSubviewToggleClass(docChannel === "customer")}
                    onClick={() => setDocChannel("customer")}
                  >
                    Shared with customer
                  </button>
                </div>
                <DocumentsList
                  variant="embedded"
                  billOfLading={billOfLading || undefined}
                  currentUserId={currentUserId}
                  storedFiles={attachmentsNewestFirst.map((a) => ({
                    id: a.id,
                    name: a.file_name,
                    contentType: a.content_type,
                    storagePath: a.storage_path,
                    uploadedByUserId: a.uploaded_by,
                    uploadedByLabel:
                      messageAuthorByUserId[a.uploaded_by]?.trim() || "Unknown user",
                    onOpen: () => void openAttachment(a),
                  }))}
                  onPickFiles={(files) => void pickAttachmentFiles(files)}
                  uploading={uploadingAttachments}
                  onRemoveFile={(id) => void removeAttachment(id)}
                  removingFileId={removingAttachmentId}
                  onRenameFile={(id, name) => renameAttachment(id, name)}
                  renamingFileId={renamingAttachmentId}
                />
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Container Details</h2>
              <button
                type="button"
                onClick={() => setContainerDetailsModalOpen(true)}
                aria-label="Open container details"
                aria-haspopup="dialog"
                aria-expanded={containerDetailsModalOpen}
                className="group inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
              >
                <ArrowUpRight
                  className="h-4 w-4 origin-center text-zinc-500/80 transition-[color,transform] duration-400 ease-in-out group-hover:scale-110 group-hover:text-zinc-900 dark:text-white/80 dark:group-hover:text-white"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>
            <dl className="space-y-4 p-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {requestSummaryData?.carrier?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier status
                </dt>
                <dd className="mt-1">
                  <CarrierReportedStatusPill status={containerRow?.status ?? request.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Last known location
                </dt>
                <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {containerRow?.enrichment && Object.keys(containerRow.enrichment).length > 0 ? (
            <VesselEnrichmentCard enrichment={containerRow.enrichment} />
          ) : null}

          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            </div>
            <div className="h-40 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 sm:h-44">
              <ReportActivityList activity={activity} />
            </div>
          </div>
        </aside>
      </div>
      </div>

      <ContainerDetailsModal
        open={containerDetailsModalOpen}
        onClose={() => setContainerDetailsModalOpen(false)}
        carrierName={requestSummaryData?.carrier?.trim() ? requestSummaryData.carrier.trim() : null}
        containerNumber={request.container_number}
        reportedStatus={containerRow?.status ?? request.status}
        lastKnownDisplay={carrierLastKnownDisplay}
        lastSyncedAtDisplay={carrierLastSyncedDisplay}
        detailRows={carrierDetailRows}
      />

    </div>
  );
}
