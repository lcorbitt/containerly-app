import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";

export interface DashboardMessageThreadsProps {
  threads: ShipmentMessageThreadSummary[];
  loading?: boolean;
}
