"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useDeleteShipmentMessageMutation,
  useUpdateShipmentMessageMutation,
  useCreateContainerMessageMutation,
} from "@/hooks/mutations/useShipmentMessageThreads";
import { useContainerWorkspaceQuery } from "@/hooks/queries/useWorkspace";
import { getBrowserAuthUserId } from "@/services/auth.service";
import {
  openContainerWorkspaceAttachmentSignedUrl,
  removeContainerWorkspaceAttachment,
  renameContainerWorkspaceAttachment,
  type ContainerWorkspaceSnapshot,
  createContainerWorkspaceDocuments,
} from "@/services/workspace.service";
import { useConfirm } from "@/atoms/confirm-dialog";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { useToast } from "@/atoms/toast";
import {
  buildShipmentTimelineEvents,
  formatTimelineWhen,
  useShipmentTimelineOrder,
} from "@/components/ShipmentTimeline";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { buildAuthorAvatarUrlByUserId } from "@/components/WorkspaceThreadPanel/utils";
import { computePublicReportInsights } from "@/utils/report-insights";
import { getShipmentDetailRows, shipperReceiverFromLocation } from "@/utils/jsoncargo-display";
import { formatTimestamp } from "@/utils/datetime";
import { collectMessageSubtreeIds } from "@/utils/shipment-message-tree";
import {
  ATTACHMENT_DISPLAY_NAME_MAX_LEN,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/utils/workspace-files";
import type { ReportActivity, ShipmentMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

export type MainTab = "timeline" | "thread" | "documents";
export type MessageChannel = "team" | "customer";
export type TrackingSubview = "timeline" | "map";

export function useContainerWorkspace({
  containerId,
}: {
  containerId: string;
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { selectedOrgId } = useOrganizationWorkspace();
  const workspaceQuery = useContainerWorkspaceQuery({
    organizationId: selectedOrgId,
    containerId,
  });
  const createMessageMut = useCreateContainerMessageMutation(selectedOrgId);
  const updateMessageMut = useUpdateShipmentMessageMutation(selectedOrgId);
  const deleteMessageMut = useDeleteShipmentMessageMutation(selectedOrgId);

  const workspaceResult = workspaceQuery.data;

  const request = (workspaceResult?.ok ? workspaceResult.request : null) as TrackingRequest | null;
  const messages = (workspaceResult?.ok ? workspaceResult.messages : []) as ShipmentMessage[];
  const messageAuthorByUserId = workspaceResult?.ok ? workspaceResult.messageAuthorByUserId : {};
  const messageAuthorEmailByUserId = workspaceResult?.ok
    ? workspaceResult.messageAuthorEmailByUserId
    : {};
  const profileImagePathByUserId = workspaceResult?.ok
    ? workspaceResult.profileImagePathByUserId
    : {};
  const activity = (workspaceResult?.ok ? workspaceResult.activity : []) as ReportActivity[];
  const activityEvents = (workspaceResult?.ok
    ? workspaceResult.activityEvents
    : []) as ShipmentActivityEvent[];
  const timeline = (workspaceResult?.ok ? workspaceResult.timeline : []) as PublicTimelineEvent[];
  const queryAttachments = (workspaceResult?.ok
    ? workspaceResult.attachments
    : []) as WorkspaceAttachment[];
  const queryContainerRow = workspaceResult?.ok ? workspaceResult.containerRow : null;
  const queryBolGroupSiblings = workspaceResult?.ok ? workspaceResult.bolGroupSiblings : [];

  const mergedTimelineEvents = useMemo(
    () => buildShipmentTimelineEvents({ carrierEvents: timeline, activityEvents }),
    [timeline, activityEvents],
  );
  const timelineOrder = useShipmentTimelineOrder(mergedTimelineEvents);
  const containerRow = queryContainerRow;
  const bolGroupSiblings = queryBolGroupSiblings;
  const loading = workspaceQuery.isLoading;
  const loadError =
    workspaceResult && !workspaceResult.ok
      ? workspaceResult.error
      : workspaceQuery.error instanceof Error
        ? workspaceQuery.error.message
        : null;
  const [body, setBody] = useState("");
  const [docChannel, setDocChannel] = useState<MessageChannel>("team");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("timeline");
  const [trackingSubview, setTrackingSubview] = useState<TrackingSubview>("timeline");
  const [containerDetailsModalOpen, setContainerDetailsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [attachments, setAttachments] = useState<WorkspaceAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<string | null>(null);
  const [composerPendingFiles, setComposerPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    setAttachments(queryAttachments);
  }, [queryAttachments]);

  useEffect(() => {
    if (workspaceResult?.ok && workspaceResult.quietAttachmentWarning) {
      toast(`Could not load attachments: ${workspaceResult.quietAttachmentWarning}`, "error");
    }
  }, [workspaceResult, toast]);

  const refetchWorkspace = useCallback(async () => {
    await workspaceQuery.refetch();
  }, [workspaceQuery]);

  const attachmentsByMessageId = useMemo(() => {
    const m = new Map<string, WorkspaceAttachment[]>();
    for (const a of attachments) {
      const mid = a.shipment_message_id;
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

  const authorAvatarUrlByUserId = useMemo(
    () => buildAuthorAvatarUrlByUserId(profileImagePathByUserId),
    [profileImagePathByUserId],
  );

  const threadMessages = useMemo(
    () => messages.filter((m) => !m.is_internal),
    [messages],
  );

  const shipmentLoc = (containerRow?.location as Record<string, unknown> | null) ?? null;
  const carrierDetailRows = useMemo(() => getShipmentDetailRows(shipmentLoc), [shipmentLoc]);
  const shipperReceiver = useMemo(() => shipperReceiverFromLocation(shipmentLoc), [shipmentLoc]);
  const billOfLading = useMemo(() => {
    if (!shipmentLoc || typeof shipmentLoc !== "object") return "";
    const v = (shipmentLoc as Record<string, unknown>).bill_of_lading;
    return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
  }, [shipmentLoc]);

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

  const lastSyncLabel =
    request?.last_sync_at != null
      ? formatTimelineWhen(request.last_sync_at)
      : containerRow?.last_synced_at != null
        ? formatTimelineWhen(containerRow.last_synced_at)
        : null;

  const carrierLastSyncedDisplay =
    containerRow?.last_synced_at != null
      ? formatTimestamp(containerRow.last_synced_at)
      : request?.last_sync_at != null
        ? formatTimestamp(request.last_sync_at)
        : null;

  const carrierLastKnownDisplay =
    requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : null;

  // --- Data loading ---

  useEffect(() => {
    void getBrowserAuthUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    if (!replyParentId) return;
    const ok = threadMessages.some((m) => m.id === replyParentId);
    if (!ok) setReplyParentId(null);
  }, [threadMessages, replyParentId]);

  // --- Composer file handling ---

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

  // --- Message actions ---

  const startEditMessage = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      setEditingMessageId(messageId);
      setEditDraft(msg.body);
    },
    [messages],
  );

  const cancelEditMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditDraft("");
  }, []);

  const saveEditMessage = useCallback(
    async (messageId: string) => {
      const trimmed = editDraft.trim();
      if (!trimmed) {
        toast("Message cannot be empty.", "error");
        return;
      }
      try {
        await updateMessageMut.mutateAsync({
          messageId,
          body: trimmed,
          containerId,
        });
        setEditingMessageId(null);
        setEditDraft("");
        toast("Message updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update message", "error");
      }
    },
    [containerId, editDraft, updateMessageMut, toast],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
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
      try {
        await deleteMessageMut.mutateAsync({ messageId, containerId });
        setReplyParentId((prev) => {
          const ids = collectMessageSubtreeIds(messages, messageId);
          return prev && ids.has(prev) ? null : prev;
        });
        toast("Message deleted", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete message", "error");
      } finally {
        setDeletingMessageId(null);
      }
    },
    [confirm, containerId, deleteMessageMut, messages, toast],
  );

  const postMessage = useCallback(async () => {
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
        toast(`"${f.name}" exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} size limit.`, "error");
        return;
      }
    }
    try {
      const { attachmentErrors } = await createMessageMut.mutateAsync({
        containerId,
        body: t,
        replyParentId,
        files,
      });
      for (const msg of attachmentErrors) {
        toast(msg, "error");
      }

      setBody("");
      setComposerPendingFiles([]);
      setReplyParentId(null);
      toast("Message posted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post message", "error");
    }
  }, [body, composerPendingFiles, containerId, createMessageMut, replyParentId, selectedOrgId, toast]);

  // --- Attachment actions ---

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

  const pickAttachmentFiles = useCallback(
    async (files: FileList | null) => {
      const queue = files ? Array.from(files) : [];
      if (!queue.length || !selectedOrgId) return;
      setUploadingAttachments(true);
      let uploadedCount = 0;
      try {
        const { inserted, errors } = await createContainerWorkspaceDocuments({
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
        await refetchWorkspace();
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
    },
    [selectedOrgId, containerId, docChannel, refetchWorkspace, toast],
  );

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

  const removeAttachment = useCallback(
    async (attachmentId: string) => {
      const row = attachments.find((a) => a.id === attachmentId);
      if (!row) return;
      const ok = await confirm({
        title: "Delete Document?",
        description: `Permanently delete "${row.file_name}" from this request?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "danger",
      });
      if (!ok) return;
      setRemovingAttachmentId(attachmentId);
      try {
        await removeContainerWorkspaceAttachment({
          attachmentId,
          storagePath: row.storage_path,
        });
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        toast("Document deleted", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete document", "error");
      } finally {
        setRemovingAttachmentId(null);
      }
    },
    [attachments, confirm, toast],
  );

  return {
    selectedOrgId,
    loading,
    loadError,

    request,
    containerRow,
    bolGroupSiblings,
    timeline,
    timelineOrder,
    activity,
    shipmentLoc,

    mainTab,
    setMainTab,
    trackingSubview,
    setTrackingSubview,

    threadMessages,
    messageAuthorByUserId,
    messageAuthorEmailByUserId,
    authorAvatarUrlByUserId,
    attachmentsByMessageId,
    body,
    setBody,
    posting: createMessageMut.isPending,
    replyParentId,
    setReplyParentId,
    currentUserId,
    deletingMessageId,
    editingMessageId,
    editDraft,
    setEditDraft,
    startEditMessage,
    cancelEditMessage,
    saveEditMessage,
    savingEditMessageId: updateMessageMut.isPending ? editingMessageId : null,
    composerPendingFiles,
    onComposerPickFiles,
    onRemoveComposerPendingFile,
    postMessage,
    deleteMessage,

    docChannel,
    setDocChannel,
    attachmentsNewestFirst,
    uploadingAttachments,
    removingAttachmentId,
    renamingAttachmentId,
    openAttachment,
    pickAttachmentFiles,
    renameAttachment,
    removeAttachment,

    containerDetailsModalOpen,
    setContainerDetailsModalOpen,

    requestSummaryData,
    shipperReceiver,
    carrierDetailRows,
    billOfLading,
    lastSyncLabel,
    carrierLastSyncedDisplay,
    carrierLastKnownDisplay,
  };
}
