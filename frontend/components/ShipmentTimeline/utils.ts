import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Anchor,
  Barcode,
  Building2,
  FileCheck,
  FileInput,
  FileText,
  FileX,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Shield,
  ShieldAlert,
  Ship,
  Truck,
} from "lucide-react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { TIMELINE_EVENT_ELEMENT_ID_PREFIX } from "./constants";
import {
  messageActivityCommunicationTitle,
  truncateMessageActivityPreview,
  formatCommunicationTimelinePreview,
} from "@/utils/message-activity-event";
import { formatShortTimestamp } from "@/utils/datetime";
import type { PublicTimelineEvent } from "@/types/public-report";
import type { ShipmentTimelineDisplayEvent, TimelineDocumentMeta, TimelineDocumentMetaItem, TimelineTone } from "./types";
import { GENERIC_EVENT_TYPE } from "./constants";

/** Short timestamp for timeline cards (matches messages sidenav). */
export function formatTimelineWhen(iso: string) {
  return formatShortTimestamp(iso);
}

export function humanizeCarrierToken(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function eventHeading(
  ev: ShipmentTimelineDisplayEvent,
): { title: string; subtitle: string | null } {
  if (ev.displayTitle?.trim()) {
    return {
      title: ev.displayTitle.trim(),
      subtitle: ev.displaySubtitle?.trim() ?? null,
    };
  }

  const et = ev.event_type.trim();
  const st = ev.status?.trim() ?? null;

  if (st && GENERIC_EVENT_TYPE.test(et)) {
    return { title: humanizeCarrierToken(st), subtitle: null };
  }
  if (st && st.toUpperCase() !== et.toUpperCase()) {
    return { title: humanizeCarrierToken(st), subtitle: et };
  }
  if (st) {
    return { title: et, subtitle: humanizeCarrierToken(st) };
  }
  return { title: humanizeCarrierToken(et), subtitle: null };
}

export function formatApprovalStatusLabel(status: string): string {
  switch (status.trim().toLowerCase()) {
    case "pending":
      return "Pending Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return humanizeCarrierToken(status);
  }
}

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function readMetadataNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseDocumentMetaItem(raw: unknown): TimelineDocumentMetaItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const item: TimelineDocumentMetaItem = {
    attachmentId: readMetadataString(row, "attachment_id"),
    fileName: readMetadataString(row, "file_name"),
    documentType: readMetadataString(row, "document_type"),
    documentGroup: readMetadataString(row, "document_group"),
    approvalStatus: readMetadataString(row, "approval_status"),
  };
  return item.fileName?.trim() || item.documentType?.trim() || item.documentGroup?.trim()
    ? item
    : null;
}

function parseDocumentMetaItems(metadata: Record<string, unknown>): TimelineDocumentMetaItem[] {
  const raw = metadata.documents;
  if (!Array.isArray(raw)) return [];
  return raw.map(parseDocumentMetaItem).filter((item): item is TimelineDocumentMetaItem => item != null);
}

export function isBatchDocumentUploadMeta(meta: TimelineDocumentMeta): boolean {
  if ((meta.documents?.length ?? 0) > 1) return true;
  if (meta.fileCount != null && meta.fileCount > 1) return true;
  return false;
}

export function parseActivityDocumentMeta(
  metadata: Record<string, unknown> | null | undefined,
): TimelineDocumentMeta | null {
  if (!metadata || typeof metadata !== "object") return null;

  const documents = parseDocumentMetaItems(metadata);
  const fileCount = readMetadataNumber(metadata, "file_count") ?? (documents.length > 0 ? documents.length : null);
  const primaryDocument = documents.length === 1 ? documents[0] : null;

  const meta: TimelineDocumentMeta = {
    fileName: readMetadataString(metadata, "file_name") ?? primaryDocument?.fileName ?? null,
    documentType:
      readMetadataString(metadata, "document_type") ?? primaryDocument?.documentType ?? null,
    documentGroup:
      readMetadataString(metadata, "document_group") ?? primaryDocument?.documentGroup ?? null,
    approvalStatus:
      readMetadataString(metadata, "approval_status") ?? primaryDocument?.approvalStatus ?? null,
    rejectionReason: readMetadataString(metadata, "rejection_reason"),
    trackingNumber: readMetadataString(metadata, "tracking_number"),
    fileCount,
    documents: documents.length > 0 ? documents : undefined,
  };

  return hasTimelineDocumentMeta(meta) ? meta : null;
}

function resolveAttachmentDisplayName(
  attachmentId: string | null | undefined,
  fallback: string | null | undefined,
  attachmentDisplayNamesById: Record<string, string>,
): string | null {
  if (attachmentId && attachmentDisplayNamesById[attachmentId]?.trim()) {
    return attachmentDisplayNamesById[attachmentId].trim();
  }
  return fallback?.trim() || null;
}

export function enrichTimelineDocumentMeta(
  meta: TimelineDocumentMeta | null,
  metadata: Record<string, unknown>,
  attachmentDisplayNamesById?: Record<string, string>,
): TimelineDocumentMeta | null {
  if (!meta || !attachmentDisplayNamesById || Object.keys(attachmentDisplayNamesById).length === 0) {
    return meta;
  }

  const topAttachmentId = readMetadataString(metadata, "attachment_id");
  const documents = meta.documents?.map((doc) => ({
    ...doc,
    fileName: resolveAttachmentDisplayName(
      doc.attachmentId,
      doc.fileName,
      attachmentDisplayNamesById,
    ),
  }));

  const singleDocument = documents?.length === 1 ? documents[0] : null;

  return {
    ...meta,
    fileName: resolveAttachmentDisplayName(
      topAttachmentId,
      meta.fileName ?? singleDocument?.fileName ?? null,
      attachmentDisplayNamesById,
    ),
    documents,
  };
}

export function hasTimelineDocumentMeta(meta: TimelineDocumentMeta): boolean {
  return Boolean(
    meta.fileName?.trim() ||
      meta.documentType?.trim() ||
      meta.documentGroup?.trim() ||
      meta.approvalStatus?.trim() ||
      meta.rejectionReason?.trim() ||
      meta.trackingNumber?.trim() ||
      (meta.fileCount != null && meta.fileCount > 0) ||
      (meta.documents?.length ?? 0) > 0,
  );
}

function readChangedFieldLabels(metadata: Record<string, unknown>): string | null {
  const raw = metadata.changed_fields;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const labels = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const label = readMetadataString(entry as Record<string, unknown>, "label");
      return label;
    })
    .filter((label): label is string => Boolean(label));
  return labels.length > 0 ? labels.join(", ") : null;
}

export function formatShipmentEditedSubtitle(metadata: Record<string, unknown>): string | null {
  return readChangedFieldLabels(metadata);
}

export function formatShipmentCreatedSubtitle(metadata: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const orderNumber = readMetadataString(metadata, "order_number");
  if (orderNumber) parts.push(`Order ${orderNumber}`);
  const customerName = readMetadataString(metadata, "customer_name");
  if (customerName) parts.push(customerName);
  const containerNumber = readMetadataString(metadata, "container_number");
  if (containerNumber) parts.push(containerNumber);
  const portOfLoading = readMetadataString(metadata, "port_of_loading");
  const portOfDestination = readMetadataString(metadata, "port_of_destination");
  if (portOfLoading && portOfDestination) {
    parts.push(`${portOfLoading} → ${portOfDestination}`);
  } else if (portOfLoading) {
    parts.push(portOfLoading);
  } else if (portOfDestination) {
    parts.push(portOfDestination);
  }
  const lineCount = readMetadataNumber(metadata, "line_count");
  if (lineCount != null && lineCount > 0) {
    parts.push(`${lineCount} ${lineCount === 1 ? "line" : "lines"}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function isTrackingNumberActivityEvent(
  eventType: string,
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return eventType === "originals_mailed" && Boolean(readMetadataString(metadata ?? {}, "tracking_number"));
}

function formatRiskLevelLabel(level: string | null | undefined): string {
  switch (level?.trim().toLowerCase()) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return humanizeCarrierToken(level ?? "Carrier Default");
  }
}

export function activityEventTitle(event: ShipmentActivityEvent): string {
  const documentMeta = parseActivityDocumentMeta(event.metadata);
  const showsFileInMeta = Boolean(documentMeta?.fileName?.trim());

  switch (event.event_type) {
    case "shipment_created":
      return "Shipment created";
    case "shipment_edited":
      return "Shipment details updated";
    case "drafts_attached":
      return "Draft documents uploaded";
    case "documents_approved":
      return showsFileInMeta ? "Document approved" : "Draft documents approved by customer";
    case "documents_rejected":
      return "Document rejected";
    case "originals_mailed": {
      if (isTrackingNumberActivityEvent(event.event_type, event.metadata)) {
        return "Tracking number added";
      }
      const body = event.body?.trim();
      if (body) {
        const stripped = body.replace(/^\d{1,2}\/\d{1,2}\/\d{2}\s—\s*/, "").trim();
        if (stripped) return stripped;
      }
      return "Original documents mailed";
    }
    case "tracking_linked":
      return "Carrier tracking linked";
    case "risk_status_updated": {
      const riskLevel = readMetadataString(event.metadata ?? {}, "risk_level");
      return `Risk status set to ${formatRiskLevelLabel(riskLevel)}`;
    }
    case "customer_message":
    case "operator_message": {
      const meta =
        event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
          ? event.metadata
          : {};
      const name = readMetadataString(meta, "author_display_name") ?? (event.event_type === "customer_message" ? "Customer" : "Team member");
      return messageActivityCommunicationTitle(name);
    }
    default:
      break;
  }

  const body = event.body?.trim();
  if (body) {
    const stripped = body.replace(/^\d{1,2}\/\d{1,2}\/\d{2}\s—\s*/, "").trim();
    if (stripped) return stripped;
  }

  return body || humanizeCarrierToken(event.event_type);
}

export function mapActivityEventToTimelineEvent(
  event: ShipmentActivityEvent,
  attachmentDisplayNamesById?: Record<string, string>,
): ShipmentTimelineDisplayEvent {
  const metadata = event.metadata ?? {};
  const parsedMeta = parseActivityDocumentMeta(metadata);
  const messagePreview =
    readMetadataString(metadata, "message_preview") ??
    (event.event_type === "customer_message" || event.event_type === "operator_message"
      ? truncateMessageActivityPreview(event.body)
      : null);
  const shipmentCreatedSubtitle =
    event.event_type === "shipment_created" ? formatShipmentCreatedSubtitle(metadata) : null;
  const shipmentEditedSubtitle =
    event.event_type === "shipment_edited" ? formatShipmentEditedSubtitle(metadata) : null;
  const trackingNumberSubtitle = isTrackingNumberActivityEvent(event.event_type, metadata)
    ? readMetadataString(metadata, "tracking_number")
    : null;
  const riskMessageSubtitle =
    event.event_type === "risk_status_updated"
      ? readMetadataString(metadata, "risk_message")
      : null;
  const isTrackingNumberEvent = trackingNumberSubtitle != null;
  return {
    id: event.id,
    event_type: event.event_type,
    status: null,
    location: null,
    occurred_at: event.occurred_at,
    source: "activity",
    displayTitle: activityEventTitle(event),
    displaySubtitle:
      messagePreview ??
      shipmentCreatedSubtitle ??
      shipmentEditedSubtitle ??
      trackingNumberSubtitle ??
      riskMessageSubtitle,
    documentMeta: isTrackingNumberEvent
      ? null
      : enrichTimelineDocumentMeta(parsedMeta, metadata, attachmentDisplayNamesById),
    activityMetadata: metadata,
  };
}

export function mapCarrierEventToTimelineEvent(
  event: PublicTimelineEvent,
): ShipmentTimelineDisplayEvent {
  return { ...event, source: "carrier" };
}

export function buildShipmentTimelineEvents(input: {
  carrierEvents?: PublicTimelineEvent[];
  activityEvents?: ShipmentActivityEvent[];
  attachmentDisplayNamesById?: Record<string, string>;
}): ShipmentTimelineDisplayEvent[] {
  const items: ShipmentTimelineDisplayEvent[] = [
    ...(input.carrierEvents ?? []).map(mapCarrierEventToTimelineEvent),
    ...(input.activityEvents ?? []).map((event) =>
      mapActivityEventToTimelineEvent(event, input.attachmentDisplayNamesById),
    ),
  ];
  return items.sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));
}

export function getLatestTimelineEventId(
  events: ShipmentTimelineDisplayEvent[],
): string | null {
  if (events.length === 0) return null;
  return events.reduce((latest, event) =>
    Date.parse(event.occurred_at) >= Date.parse(latest.occurred_at) ? event : latest,
  ).id;
}

export function timelineEventElementId(eventId: string): string {
  return `${TIMELINE_EVENT_ELEMENT_ID_PREFIX}${eventId}`;
}

function runTimelineScrollFlush(run: () => void): void {
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  window.setTimeout(run, 50);
  window.setTimeout(run, 350);
  window.setTimeout(run, 550);
}

export function scrollTimelineEventIntoView(
  eventId: string,
  behavior: ScrollBehavior = "smooth",
): void {
  const scroll = () => {
    const target = document.getElementById(timelineEventElementId(eventId));
    target?.scrollIntoView({ block: "center", behavior, inline: "nearest" });
  };
  runTimelineScrollFlush(scroll);
}

export function inferTimelineVisual(
  eventType: string,
  status: string | null,
  metadata?: Record<string, unknown> | null,
): { tone: TimelineTone; Icon: LucideIcon; label: string } {
  const t = `${eventType} ${status ?? ""}`.toLowerCase();

  if (/shipment_created/.test(t)) {
    return { tone: "shipmentCreated", Icon: Package, label: "Created" };
  }
  if (/shipment_edited/.test(t)) {
    return { tone: "system", Icon: Pencil, label: "Updated" };
  }
  if (isTrackingNumberActivityEvent(eventType, metadata)) {
    return { tone: "trackingNumber", Icon: Barcode, label: "Tracking" };
  }
  if (/drafts_attached|document.*upload|revision/.test(t)) {
    return { tone: "document", Icon: FileText, label: "Documents" };
  }
  if (/documents_approved/.test(t)) {
    return { tone: "success", Icon: FileCheck, label: "Approved" };
  }
  if (/documents_rejected/.test(t)) {
    return { tone: "rejected", Icon: FileX, label: "Rejected" };
  }
  if (/originals_mailed|originals_sent/.test(t)) {
    return { tone: "success", Icon: FileInput, label: "Sent" };
  }
  if (/risk_status/.test(t)) {
    return { tone: "customs", Icon: ShieldAlert, label: "Risk" };
  }
  if (/tracking_linked|carrier/.test(t)) {
    return { tone: "system", Icon: Activity, label: "Tracking" };
  }
  if (/customer_message/.test(t)) {
    return { tone: "customerMessage", Icon: MessageSquare, label: "Communication" };
  }
  if (/operator_message/.test(t)) {
    return { tone: "operatorMessage", Icon: MessageSquare, label: "Communication" };
  }
  if (/message/.test(t)) {
    return { tone: "operatorMessage", Icon: MessageSquare, label: "Communication" };
  }

  if (/custom|clearance|hold|inspect|exam|cfs|bond|quarantine|detain/.test(t)) {
    return { tone: "customs", Icon: Shield, label: "Customs" };
  }
  if (/load|gate.?out|empty|depart|sail|ocean|vessel|feeder|transship|onboard|shipped|in_transit|at_sea/.test(t)) {
    return { tone: "vessel", Icon: Ship, label: "At Sea" };
  }
  if (/arriv|berth|port|discharg|unload|ingate|destination|delivered|pod|discharge|anchored/.test(t)) {
    return { tone: "port", Icon: Anchor, label: "Port" };
  }
  if (/rail|truck|haul|dray|cartage|on.?carriage|door|pickup|delivery/.test(t)) {
    return { tone: "land", Icon: Truck, label: "Inland" };
  }
  if (/warehouse|depot|yard|storage|terminal/.test(t)) {
    return { tone: "land", Icon: Building2, label: "Facility" };
  }
  if (/packed|carton|sku|package|unit/.test(t)) {
    return { tone: "milestone", Icon: Package, label: "Cargo" };
  }
  if (/sync|status_update|status\b|poll|telemetry|webhook|heartbeat/.test(t)) {
    return { tone: "system", Icon: Activity, label: "Feed" };
  }

  return { tone: "milestone", Icon: MapPin, label: "Milestone" };
}

export function isCommunicationTimelineEvent(eventType: string): boolean {
  return /customer_message|operator_message/.test(eventType.trim());
}

export function communicationTimelinePreview(subtitle: string | null | undefined): string | null {
  if (!subtitle?.trim()) return null;
  return formatCommunicationTimelinePreview(subtitle);
}

export function formatLocationSnippet(loc: Record<string, unknown>): string | null {
  const keys = ["last_location", "name", "city", "port", "country", "location", "facility", "terminal", "code"];
  for (const k of keys) {
    const v = loc[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  const first = Object.entries(loc).find(([, v]) => v != null && String(v).trim());
  return first ? `${first[0]}: ${String(first[1])}` : null;
}
