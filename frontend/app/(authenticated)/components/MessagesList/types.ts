import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";

export type MessagesListViewer = "operator" | "customer";

export interface MessagesListProps {
  threads: ShipmentMessageThreadSummary[];
  onItemNavigate?: () => void;
  viewer?: MessagesListViewer;
}
