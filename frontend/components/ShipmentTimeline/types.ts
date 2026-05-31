import type { PublicTimelineEvent } from "@/types/public-report";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";

export type TimelineTone = "vessel" | "port" | "land" | "customs" | "system" | "milestone" | "document";

/** One file within a batch upload activity event. */
export interface TimelineDocumentMetaItem {
  attachmentId?: string | null;
  fileName?: string | null;
  documentType?: string | null;
  documentGroup?: string | null;
  approvalStatus?: string | null;
}

/** Document fields parsed from shipment activity event metadata. */
export interface TimelineDocumentMeta {
  fileName?: string | null;
  documentType?: string | null;
  documentGroup?: string | null;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
  trackingNumber?: string | null;
  fileCount?: number | null;
  /** Per-file details when a single upload action included multiple files. */
  documents?: TimelineDocumentMetaItem[];
}

export type ShipmentTimelineDisplayEvent = PublicTimelineEvent & {
  source?: "carrier" | "activity";
  /** Override title for workflow / activity milestones. */
  displayTitle?: string | null;
  /** Parsed document metadata for activity-sourced events. */
  documentMeta?: TimelineDocumentMeta | null;
};

export interface ShipmentTimelineProps {
  events?: PublicTimelineEvent[];
  activityEvents?: ShipmentActivityEvent[];
  /** When false, cards are not clickable (public report). Default true for team views. */
  interactiveDetail?: boolean;
  /** Omit the titled header row when embedding inside another shell (e.g. tabbed request page). */
  hideHeader?: boolean;
  /** When false, hides the new→old / old→new order toggle. Default true. */
  showOrderToggle?: boolean;
  /** Merged onto the outer section (e.g. `rounded-none border-0` inside a tab panel). */
  className?: string;
  emptyMessage?: string;
  emptyHint?: string;
  /** Scroll to the latest event when the timeline first renders with events. Default true. */
  autoScrollToLatest?: boolean;
}

export interface ShipmentTimelineOrder {
  newestFirst: boolean;
  displayEvents: ShipmentTimelineDisplayEvent[];
  orderFadeOut: boolean;
  handleOrderToggle: () => void;
}

export type ShipmentTimelineViewProps = ShipmentTimelineProps & {
  order: ShipmentTimelineOrder;
};

/** @deprecated Use ShipmentTimelineProps */
export type ContainerTimelineProps = ShipmentTimelineProps;
/** @deprecated Use ShipmentTimelineOrder */
export type ContainerTimelineOrder = ShipmentTimelineOrder;
/** @deprecated Use ShipmentTimelineViewProps */
export type ContainerTimelineViewProps = ShipmentTimelineViewProps;
