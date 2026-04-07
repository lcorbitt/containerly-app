"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Map as MapIcon, MessageSquare, Route } from "lucide-react";
import { useToast } from "@/contexts/toast";
import {
  completeImporterPortalSetup,
  fetchShipment,
  postShipmentThreadMessage,
} from "@/services/shipment.service";
import { buildMessageTree, truncatedReplyPreview } from "@/utils/report-message-tree";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace.service";
import type { PublicReportPayload } from "@/types/public-report";
import { publicThreadAuthorName, formatFreshness } from "../utils";

export type DashboardTab = "tracking" | "map" | "documents" | "messages";

export interface TabDef {
  id: DashboardTab;
  label: string;
  shortLabel: string;
  icon: typeof Route;
  count?: number;
}

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
  const [name, setName] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("tracking");
  const [setupDismissBusy, setSetupDismissBusy] = useState(false);
  const [messageContainerId, setMessageContainerId] = useState(
    () => initial.primary_container_id ?? initial.container_lines?.[0]?.id ?? "",
  );
  const [messageTarget, setMessageTarget] = useState<"shipment" | "container">("container");

  const { report, organization, summary, insights, timeline, alerts, messages } = payload;
  const attachments = payload.attachments ?? [];
  const containerLines = payload.container_lines ?? [];
  const logisticsHints = payload.logistics_hints;
  const threadReadOnly = readOnlyMessaging || payload.viewer === "operator";
  const enrichmentBlock = payload.enrichment;

  // Sync messageContainerId when payload changes
  useEffect(() => {
    const fallback =
      payload.primary_container_id ?? payload.container_lines?.[0]?.id ?? "";
    setMessageContainerId((prev) => {
      if (prev && payload.container_lines?.some((c) => c.id === prev)) return prev;
      return fallback;
    });
  }, [payload.primary_container_id, payload.container_lines]);

  async function refresh() {
    const r = await fetchShipment(shipmentId);
    if (r.ok) setPayload(r.data);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t) return;
    if (messageTarget === "container" && !messageContainerId) {
      toast("Select which container this message is about.", "error");
      return;
    }
    setSending(true);
    try {
      const r = await postShipmentThreadMessage({
        shipmentId,
        ...(messageTarget === "container" ? { containerId: messageContainerId } : {}),
        body: t,
        authorDisplayName: name.trim() || undefined,
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
  }

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

  const messageTree = useMemo(() => buildMessageTree(messages), [messages]);
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const replyPreview = useMemo(() => {
    if (!replyParentId) return null;
    const m = messages.find((x) => x.id === replyParentId);
    if (!m) return null;
    return { label: publicThreadAuthorName(m), excerpt: truncatedReplyPreview(m.body, 120) };
  }, [replyParentId, messages]);

  // Sync message target scope when replying to a specific message
  useEffect(() => {
    if (!replyParentId) return;
    const m = messages.find((x) => x.id === replyParentId);
    if (!m) return;
    if (m.scope === "shipment" || m.container_id == null) {
      setMessageTarget("shipment");
    } else {
      setMessageTarget("container");
      setMessageContainerId(m.container_id);
    }
  }, [replyParentId, messages]);

  const showMessageScopeLabels = useMemo(
    () =>
      containerLines.length > 1 ||
      messages.some((m) => m.scope === "shipment" || m.container_id == null),
    [containerLines.length, messages],
  );

  const updatesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef<number | null>(null);
  useEffect(() => {
    if (prevMessageCount.current === null) {
      prevMessageCount.current = messages.length;
      return;
    }
    if (messages.length > prevMessageCount.current) {
      updatesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const fresh = formatFreshness(summary.freshness_minutes);

  const tabDefs: TabDef[] = useMemo(
    () => [
      { id: "tracking", label: "Tracking", shortLabel: "Tracking", icon: Route },
      { id: "map", label: "Map", shortLabel: "Map", icon: MapIcon },
      { id: "messages", label: "Messages", shortLabel: "Messages", icon: MessageSquare, count: messages.length },
      { id: "documents", label: "Documents", shortLabel: "Documents", icon: FileText, count: attachments.length },
    ],
    [messages.length, attachments.length],
  );

  return {
    // Payload slices
    payload,
    report,
    organization,
    summary,
    insights,
    timeline,
    alerts,
    messages,
    attachments,
    containerLines,
    logisticsHints,
    enrichmentBlock,

    // Computed
    fresh,
    threadReadOnly,
    messageTree,
    messageById,
    replyPreview,
    showMessageScopeLabels,
    tabDefs,

    // UI state
    body,
    setBody,
    name,
    setName,
    replyParentId,
    setReplyParentId,
    sending,
    rawOpen,
    setRawOpen,
    dashboardTab,
    setDashboardTab,
    setupDismissBusy,
    messageContainerId,
    setMessageContainerId,
    messageTarget,
    setMessageTarget,

    // Refs
    updatesEndRef,

    // Handlers
    onSubmit,
    handleSetupDismiss,
    handleDocumentOpen,
  };
}
