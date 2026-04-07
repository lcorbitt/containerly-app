/**
 * Re-export shipment portal DTOs from the shared DTO layer.
 *
 * Canonical types live in `shared/dto/shipment.dto.ts`. This file provides
 * backward-compatible aliases so existing frontend code continues to compile
 * without mass-renaming.
 */

export type {
  ReportMeta as PublicReportMeta,
  ReportOrganization as PublicReportOrg,
  ContainerLine as PublicReportContainerLine,
  ReportSummary as PublicReportSummary,
  ReportInsights as PublicReportInsights,
  TimelineEvent as PublicTimelineEvent,
  Alert as PublicAlert,
  ThreadMessage as PublicThreadMessage,
  PortalAttachment as PublicPortalAttachment,
  ShipmentAccessMeta,
  LogisticsHints as PublicLogisticsHints,
  ShipmentPortalPayload as PublicReportPayload,
} from "@shared/dto/shipment.dto";
