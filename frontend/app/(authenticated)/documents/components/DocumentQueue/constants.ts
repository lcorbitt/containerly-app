import type { DocumentQueueFilter } from "@/services/shipment.service";
import { SHIPMENT_WORKFLOW_STATUS_LABELS } from "@/utils/shipment-workflow-status";
import type { ShipmentWorkflowStatus } from "@shared/dto/logistics.dto";

export const DOCUMENT_QUEUE_PANEL_CLASS =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

export const DOCUMENT_QUEUE_FILTERS: readonly {
  id: DocumentQueueFilter;
  label: string;
}[] = [
  { id: "all", label: "All Stages" },
  ...(Object.entries(SHIPMENT_WORKFLOW_STATUS_LABELS) as [ShipmentWorkflowStatus, string][]).map(
    ([id, label]) => ({ id, label }),
  ),
];

export const DOCUMENT_QUEUE_ROW_CLASS =
  "block px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60";

export const DOCUMENT_QUEUE_FILTER_ACTIVE_CLASS =
  "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50";

export const DOCUMENT_QUEUE_FILTER_INACTIVE_CLASS =
  "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100";
