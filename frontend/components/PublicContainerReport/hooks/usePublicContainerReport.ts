"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DOCUMENT_TYPE_NONE_VALUE } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentWorkspaceScopePanel/ShipmentDocumentUploadZone/constants";
import { useToast } from "@/contexts/toast";
import { MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH } from "@/utils/workspace-files";
import { uploadShipmentScopeStandaloneFiles } from "@/services/workspace.service";
import { usePostgresRealtimeInvalidation } from "@/hooks/usePostgresRealtimeInvalidation";
import { orgReportMessagesRealtimeDedupeKey } from "@/hooks/queries/useOrgReportMessagesRealtime";
import { createClient } from "@/lib/supabase/client";
import {
  completeImporterPortalSetup,
  fetchShipment,
  postShipmentThreadMessage,
  reviewShipmentDocument,
} from "@/services/shipment.service";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace.service";
import { buildMessageTree, truncatedReplyPreview } from "@/utils/report-message-tree";
import type { PublicReportPayload } from "@/types/public-report";
import type { PortalDetailsTabId } from "../PortalDetailsTabs";
import { formatFreshness } from "../utils";
import { buildAuthorAvatarUrlByUserId } from "@/components/WorkspaceThreadPanel/utils";
import {
  buildPortalAttachmentsByMessageId,
  buildPortalMessageAuthorMap,
  portalThreadMessageToReportMessage,
} from "../portal-message-utils";

export function usePublicContainerReport({
  shipmentId,
  initial,
  readOnlyMessaging = false,
}: {
  shipmentId: string;
  initial: PublicReportPayload;
  readOnlyMessaging?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [payload, setPayload] = useState(initial);
  const [body, setBody] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<PortalDetailsTabId>("tracking");
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});
  const [setupDismissBusy, setSetupDismissBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPE_NONE_VALUE);
  const [documentGroup, setDocumentGroup] = useState<"draft" | "revision" | "original">("draft");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const organizationId = payload.organization?.id ?? null;

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
    () => visibleMessages.map(portalThreadMessageToReportMessage),
    [visibleMessages],
  );

  const messageAuthorByUserId = useMemo(
    () => buildPortalMessageAuthorMap(visibleMessages),
    [visibleMessages],
  );

  const authorAvatarUrlByUserId = useMemo(
    () => buildAuthorAvatarUrlByUserId(payload.profile_image_path_by_user_id ?? {}),
    [payload.profile_image_path_by_user_id],
  );

  const attachmentsByMessageId = useMemo(
    () => buildPortalAttachmentsByMessageId(attachments),
    [attachments],
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
    const r = await fetchShipment(shipmentId);
    if (r.ok) setPayload(r.data);
    router.refresh();
  }, [shipmentId, router]);

  usePostgresRealtimeInvalidation({
    enabled: Boolean(organizationId),
    dedupeKey: organizationId ? orgReportMessagesRealtimeDedupeKey(organizationId) : "",
    table: "report_messages",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    onEvent: () => {
      void refresh();
    },
  });

  const postMessage = useCallback(async () => {
    const t = body.trim();
    if (!t) return;
    setSending(true);
    try {
      const r = await postShipmentThreadMessage({
        shipmentId,
        body: t,
        parentMessageId: replyParentId,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      setBody("");
      setReplyParentId(null);
      await refresh();
      toast("Message sent", "success");
    } finally {
      setSending(false);
    }
  }, [body, replyParentId, shipmentId, refresh, toast]);

  async function handleSetupDismiss() {
    setSetupDismissBusy(true);
    try {
      const r = await completeImporterPortalSetup(shipmentId);
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      await refresh();
      toast("Got it — you can update your profile anytime from account settings.", "success");
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
        const uploaded = await uploadShipmentScopeStandaloneFiles({
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
      const r = await reviewShipmentDocument({
        attachment_id: attachmentId,
        shipment_id: shipmentId,
        action,
        rejection_reason: rejectReasonById[attachmentId],
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      await refresh();
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
    sending,
    dashboardTab,
    setDashboardTab,
    setupDismissBusy,
    currentUserId,
    messageAuthorByUserId,
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
    handleSetupDismiss,
    handleDocumentOpen,
    handleDocumentReview,
    refresh,
  };
}
