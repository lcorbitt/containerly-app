"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteShipmentMessageMutation,
  useUpdateShipmentMessageMutation,
  useCreateShipmentMessageMutation,
} from "@/hooks/mutations/useShipmentMessageThreads";
import { shipmentPortalQueryKey, useShipmentPortalQuery } from "@/hooks/queries/useShipment";
import { DOCUMENT_TYPE_NONE_VALUE } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentWorkspaceScopePanel/ShipmentDocumentUploadZone/constants";
import { useConfirm } from "@/atoms/confirm-dialog";
import { useToast } from "@/atoms/toast";
import {
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH,
} from "@/utils/workspace-files";
import { collectMessageSubtreeIds } from "@/utils/shipment-message-tree";
import {
  createWorkspaceAttachmentSignedUrl,
  createShipmentScopeStandaloneFiles,
} from "@/services/workspace.service";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import { orgShipmentMessagesRealtimeDedupeKey } from "@/hooks/queries/useShipmentMessageThreads";
import { createClient } from "@/lib/supabase/client";
import {
  completeImporterPortalSetup,
  updateShipmentDocument,
} from "@/services/shipment.service";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace.service";
import type { WorkspaceAttachment } from "@/types/database";
import { buildMessageTree, truncatedReplyPreview } from "@/utils/shipment-message-tree";
import type { PublicReportPayload } from "@/types/public-report";
import type { PortalDetailsTabId } from "./PortalDetailsTabs";
import { formatFreshness } from "./utils";
import { buildAuthorAvatarUrlByUserId } from "@/components/WorkspaceThreadPanel/utils";
import {
  countShipmentScopeDocuments,
  countShipmentScopeMessages,
  countShipmentScopeTimelineEvents,
} from "@/utils/workspace-tab-counts";
import {
  buildPortalAttachmentsByMessageId,
  buildPortalMessageAuthorEmailMap,
  buildPortalMessageAuthorMap,
  portalThreadMessageToShipmentMessage,
} from "./portal-message-utils";

export function usePublicContainerReport({
  shipmentId,
  initial,
  readOnlyMessaging = false,
}: {
  shipmentId: string;
  initial: PublicReportPayload;
  readOnlyMessaging?: boolean;
}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const qc = useQueryClient();
  const portalQuery = useShipmentPortalQuery(shipmentId);

  const payload = portalQuery.data?.ok ? portalQuery.data.data : initial;
  const organizationId = payload.organization?.id ?? null;
  const createMessageMut = useCreateShipmentMessageMutation(organizationId);
  const updateMessageMut = useUpdateShipmentMessageMutation(organizationId);
  const deleteMessageMut = useDeleteShipmentMessageMutation(organizationId);

  const [body, setBody] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [composerPendingFiles, setComposerPendingFiles] = useState<File[]>([]);
  const [dashboardTab, setDashboardTab] = useState<PortalDetailsTabId>("timeline");
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});
  const [setupDismissBusy, setSetupDismissBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPE_NONE_VALUE);
  const [documentGroup, setDocumentGroup] = useState<"draft" | "revision" | "original">("draft");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "timeline" || tab === "documents" || tab === "messages") {
      setDashboardTab(tab);
    }
  }, []);

  const { organization, summary, insights, timeline, alerts } = payload;
  const attachments = payload.attachments ?? [];
  const containerLines = payload.container_lines ?? [];
  const logisticsHints = payload.logistics_hints;
  const commercialDetails = payload.commercial_details;
  const hasTracking = containerLines.length > 0 && timeline.length > 0;

  const threadReadOnly = readOnlyMessaging || payload.preview === true;
  /** Customers upload via messages only; documents tab is review-only for importers. */
  const documentsUploadEnabled =
    !payload.preview && Boolean(organizationId) && payload.viewer !== "importer";

  const visibleMessages = useMemo(() => {
    const list = payload.messages ?? [];
    if (payload.viewer === "org_member") return list;
    return list.filter((m) => !m.is_internal);
  }, [payload.messages, payload.viewer]);

  const threadMessages = useMemo(
    () => visibleMessages.map(portalThreadMessageToShipmentMessage),
    [visibleMessages],
  );

  const profileEmailByUserId = payload.profile_email_by_user_id ?? {};

  const messageAuthorByUserId = useMemo(
    () => buildPortalMessageAuthorMap(visibleMessages, profileEmailByUserId),
    [profileEmailByUserId, visibleMessages],
  );

  const messageAuthorEmailByUserId = useMemo(
    () => buildPortalMessageAuthorEmailMap(visibleMessages, profileEmailByUserId),
    [profileEmailByUserId, visibleMessages],
  );

  const authorAvatarUrlByUserId = useMemo(
    () => buildAuthorAvatarUrlByUserId(payload.profile_image_path_by_user_id ?? {}),
    [payload.profile_image_path_by_user_id],
  );

  const attachmentsByMessageId = useMemo(
    () => buildPortalAttachmentsByMessageId(attachments),
    [attachments],
  );

  const tabCounts = useMemo(
    () => ({
      timeline: countShipmentScopeTimelineEvents({
        activityEvents: payload.activity_events ?? [],
        carrierEvents: timeline,
      }),
      documents: countShipmentScopeDocuments(attachments),
      messages: countShipmentScopeMessages(threadMessages),
    }),
    [attachments, payload.activity_events, threadMessages, timeline],
  );

  useEffect(() => {
    let cancelled = false;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        setCurrentUserId(data.user?.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: shipmentPortalQueryKey(shipmentId) });
  }, [qc, shipmentId]);

  usePostgresRealtimeInvalidation({
    enabled: Boolean(organizationId),
    dedupeKey: organizationId ? orgShipmentMessagesRealtimeDedupeKey(organizationId) : "",
    table: "shipment_messages",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    onEvent: () => {
      void refresh();
    },
  });

  const postMessage = useCallback(async () => {
    const t = body.trim();
    const files = [...composerPendingFiles];
    if (!t && files.length === 0) return;
    if (!organizationId) {
      toast("Could not send message — organization is missing.", "error");
      return;
    }
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
        shipmentId,
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
  }, [body, composerPendingFiles, organizationId, createMessageMut, replyParentId, shipmentId, toast]);

  const onComposerPickFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const incoming = Array.from(files);
      setComposerPendingFiles((prev) => {
        const cap = MAX_ATTACHMENTS_PER_MESSAGE;
        const room = cap - prev.length;
        if (room <= 0) {
          toast(`You can attach up to ${cap} files per message.`, "info");
          return prev;
        }
        const accepted = incoming.slice(0, room);
        if (incoming.length > accepted.length) {
          toast(
            `Only ${cap} files per message. ${incoming.length - accepted.length} file(s) were not added.`,
            "info",
          );
        }
        return [...prev, ...accepted];
      });
    },
    [toast],
  );

  const onRemoveComposerPendingFile = useCallback((index: number) => {
    setComposerPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const openAttachment = useCallback(
    async (row: WorkspaceAttachment) => {
      try {
        const url = await createWorkspaceAttachmentSignedUrl(row.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not open file", "error");
      }
    },
    [toast],
  );

  const startEditMessage = useCallback(
    (messageId: string) => {
      const msg = threadMessages.find((m) => m.id === messageId);
      if (!msg) return;
      setEditingMessageId(messageId);
      setEditDraft(msg.body);
    },
    [threadMessages],
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
          shipmentId,
        });
        setEditingMessageId(null);
        setEditDraft("");
        toast("Message updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update message", "error");
      }
    },
    [editDraft, updateMessageMut, shipmentId, toast],
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
        await deleteMessageMut.mutateAsync({ messageId, shipmentId });
        setReplyParentId((prev) => {
          const ids = collectMessageSubtreeIds(threadMessages, messageId);
          return prev && ids.has(prev) ? null : prev;
        });
        toast("Message deleted", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not delete message", "error");
      } finally {
        setDeletingMessageId(null);
      }
    },
    [confirm, deleteMessageMut, shipmentId, threadMessages, toast],
  );

  async function handleSetupDismiss() {
    setSetupDismissBusy(true);
    try {
      const r = await completeImporterPortalSetup(shipmentId);
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      await refresh();
      toast("Got it — you can update your profile anytime from Settings in the sidenav.", "success");
    } finally {
      setSetupDismissBusy(false);
    }
  }

  async function handleDocumentOpen(storagePath: string) {
    try {
      const url = await createWorkspaceStorageSignedUrl(storagePath, 3600);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not open file", "error");
    }
  }

  const uploadDocuments = useCallback(
    async (files: File[]): Promise<boolean> => {
      if (!organizationId) return false;
      const queue = files.filter(Boolean).slice(0, MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH);
      if (!queue.length) return false;
      if (files.filter(Boolean).length > MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH) {
        toast(`Only the first ${MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH} files were included.`, "info");
      }
      setUploadingDocuments(true);
      try {
        const uploaded = await createShipmentScopeStandaloneFiles({
          organizationId,
          shipmentId,
          files: queue,
          documentType: documentType.trim() || null,
          documentGroup,
        });
        if (uploaded.length === 0) {
          toast("No files were uploaded.", "info");
          return false;
        }
        await refresh();
        toast(uploaded.length === 1 ? "File uploaded" : `${uploaded.length} files uploaded`, "success");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
        return false;
      } finally {
        setUploadingDocuments(false);
      }
    },
    [organizationId, shipmentId, documentType, documentGroup, refresh, toast],
  );

  async function handleDocumentReview(attachmentId: string, action: "approve" | "reject") {
    if (action === "reject" && !rejectReasonById[attachmentId]?.trim()) {
      toast("Please enter a reason for rejection.", "error");
      return;
    }
    setReviewBusyId(attachmentId);
    try {
      const r = await updateShipmentDocument({
        attachment_id: attachmentId,
        shipment_id: shipmentId,
        action,
        rejection_reason: rejectReasonById[attachmentId],
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      void refresh();
      setRejectReasonById((prev) => {
        const next = { ...prev };
        delete next[attachmentId];
        return next;
      });
      toast(action === "approve" ? "Document approved" : "Document rejected", "success");
    } finally {
      setReviewBusyId(null);
    }
  }

  const messageTree = useMemo(() => buildMessageTree(threadMessages), [threadMessages]);
  const messageById = useMemo(() => new Map(threadMessages.map((m) => [m.id, m])), [threadMessages]);

  const replyPreview = useMemo(() => {
    if (!replyParentId) return null;
    const m = threadMessages.find((x) => x.id === replyParentId);
    if (!m) return null;
    const label =
      (m.author_user_id && messageAuthorByUserId[m.author_user_id]) ||
      m.author_display_name?.trim() ||
      "Message";
    return { label, excerpt: truncatedReplyPreview(m.body, 120) };
  }, [replyParentId, threadMessages, messageAuthorByUserId]);

  const showDocumentScopeLabels = useMemo(
    () =>
      containerLines.length > 1 ||
      attachments.some((a) => a.scope === "shipment" || a.container_id == null),
    [containerLines.length, attachments],
  );

  const updatesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef<number | null>(null);
  useEffect(() => {
    if (prevMessageCount.current === null) {
      prevMessageCount.current = threadMessages.length;
      return;
    }
    if (threadMessages.length > prevMessageCount.current) {
      updatesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevMessageCount.current = threadMessages.length;
  }, [threadMessages.length]);

  const fresh = formatFreshness(summary.freshness_minutes);

  const shipmentLabel =
    summary.order_number?.trim() || summary.container_number?.trim() || null;

  return {
    payload,
    organization,
    summary,
    insights,
    timeline,
    alerts,
    visibleMessages,
    threadMessages,
    attachments,
    containerLines,
    logisticsHints,

    fresh,
    threadReadOnly,
    documentsUploadEnabled,
    uploadModalOpen,
    setUploadModalOpen,
    documentType,
    setDocumentType,
    documentGroup,
    setDocumentGroup,
    uploadingDocuments,
    uploadDocuments,
    messageTree,
    messageById,
    replyPreview,
    showDocumentScopeLabels,

    body,
    setBody,
    replyParentId,
    setReplyParentId,
    sending: createMessageMut.isPending,
    dashboardTab,
    setDashboardTab,
    tabCounts,
    setupDismissBusy,
    currentUserId,
    messageAuthorByUserId,
    messageAuthorEmailByUserId,
    authorAvatarUrlByUserId,
    attachmentsByMessageId,

    updatesEndRef,
    shipmentLabel,

    commercialDetails,
    hasTracking,
    reviewBusyId,
    rejectReasonById,
    setRejectReasonById,

    postMessage,
    deleteMessage,
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
    openAttachment,
    handleSetupDismiss,
    handleDocumentOpen,
    handleDocumentReview,
    refresh,
  };
}
