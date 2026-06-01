import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Anchor,
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Shield,
  Ship,
  Truck,
  XCircle,
} from "lucide-react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import { formatTimestamp } from "@/utils/datetime";
import type { PublicTimelineEvent } from "@/types/public-report";
import type { ShipmentTimelineDisplayEvent, TimelineDocumentMeta, TimelineDocumentMetaItem, TimelineTone } from "./types";
import { GENERIC_EVENT_TYPE } from "./constants";

/** Absolute clock time on timeline cards and related UI (matches messages / activity). */
export function formatTimelineWhen(iso: string) {
  return formatTimestamp(iso);
}

export function formatIsoUtc(iso: string) {
  try {
    return new Date(iso).toISOString();
  } catch {
    return iso;
  }
}

export function formatRelativeWhen(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    const diffMs = Date.now() - d;
    const abs = Math.abs(diffMs);
    const mins = Math.round(abs / 60000);
    if (mins < 1) return diffMs >= 0 ? "Just now" : "Soon";
    if (mins < 60) return diffMs >= 0 ? `${mins}m ago` : `in ${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 48) return diffMs >= 0 ? `${hrs}h ago` : `in ${hrs}h`;
    const days = Math.round(hrs / 24);
    if (days < 14) return diffMs >= 0 ? `${days}d ago` : `in ${days}d`;
    return diffMs >= 0 ? `${Math.round(days / 7)}w ago` : `in ${Math.round(days / 7)}w`;
  } catch {
    return "";
  }
}

export function humanizeCarrierToken(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function humanizeFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function eventHeading(
  ev: ShipmentTimelineDisplayEvent,
): { title: string; subtitle: string | null } {
  if (ev.displayTitle?.trim()) {
    return { title: ev.displayTitle.trim(), subtitle: null };
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

export function formatDocumentGroupLabel(group: string): string {
  switch (group.trim().toLowerCase()) {
    case "draft":
      return "Draft";
    case "revision":
      return "Revision";
    case "original":
      return "Original";
    default:
      return humanizeCarrierToken(group);
  }
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

export function activityEventTitle(event: ShipmentActivityEvent): string {
  const documentMeta = parseActivityDocumentMeta(event.metadata);
  const showsFileInMeta = Boolean(documentMeta?.fileName?.trim());

  switch (event.event_type) {
    case "drafts_attached":
      return "Draft documents uploaded";
    case "documents_approved":
      return showsFileInMeta ? "Document approved" : "Draft documents approved by customer";
    case "documents_rejected":
      return "Document rejected";
    case "originals_mailed":
      return "Original documents mailed";
    case "tracking_linked":
      return "Carrier tracking linked";
    case "customer_message":
      return "Customer message posted";
    case "operator_message":
      return "Team message posted";
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
  const parsedMeta = parseActivityDocumentMeta(event.metadata);
  return {
    id: event.id,
    event_type: event.event_type,
    status: null,
    location: null,
    occurred_at: event.occurred_at,
    source: "activity",
    displayTitle: activityEventTitle(event),
    documentMeta: enrichTimelineDocumentMeta(
      parsedMeta,
      event.metadata ?? {},
      attachmentDisplayNamesById,
    ),
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

export function inferTimelineVisual(
  eventType: string,
  status: string | null,
): { tone: TimelineTone; Icon: LucideIcon; label: string } {
  const t = `${eventType} ${status ?? ""}`.toLowerCase();

  if (/drafts_attached|document.*upload|revision/.test(t)) {
    return { tone: "document", Icon: FileText, label: "Documents" };
  }
  if (/documents_approved|approved/.test(t)) {
    return { tone: "land", Icon: CheckCircle2, label: "Approved" };
  }
  if (/documents_rejected|rejected/.test(t)) {
    return { tone: "customs", Icon: XCircle, label: "Revision" };
  }
  if (/originals_mailed|mailed/.test(t)) {
    return { tone: "document", Icon: Mail, label: "Mailed" };
  }
  if (/tracking_linked|carrier/.test(t)) {
    return { tone: "system", Icon: Activity, label: "Tracking" };
  }
  if (/customer_message|operator_message|message/.test(t)) {
    return { tone: "milestone", Icon: MessageSquare, label: "Message" };
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

export function formatValueForDisplay(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
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
