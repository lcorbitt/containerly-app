import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FolderOpen,
  MessageSquareWarning,
  Radio,
} from "lucide-react";
import type { ShipmentInsightCard } from "@shared/dto/performance.dto";

export const SHIPMENT_STATUS_ASSESSMENT_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4";

export const SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_CLASS =
  "flex min-w-0 flex-col justify-center";

export const SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_VALUE_CLASS =
  "mt-1.5 flex min-w-0 flex-wrap items-center gap-2";

export const SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_EMPTY_CLASS =
  "text-sm text-zinc-400 dark:text-zinc-500";

export const SHIPMENT_STATUS_ASSESSMENT_INSIGHTS_CLASS = "pb-2";

export const SHIPMENT_STATUS_ASSESSMENT_INSIGHT_ROW_CLASS =
  "flex min-w-0 items-center gap-3 py-2 first:pt-0 last:pb-0";

export const SHIPMENT_STATUS_ASSESSMENT_INSIGHT_ICONS: Record<ShipmentInsightCard["tone"], LucideIcon> = {
  info: Radio,
  warning: MessageSquareWarning,
  critical: MessageSquareWarning,
};

export const SHIPMENT_STATUS_ASSESSMENT_DOCUMENTS_ICON = FolderOpen;
export const SHIPMENT_STATUS_ASSESSMENT_RISK_ICON = BarChart3;
export const SHIPMENT_STATUS_ASSESSMENT_CARRIER_ICON = Radio;
export const SHIPMENT_STATUS_ASSESSMENT_TRACKING_ICON = Radio;
