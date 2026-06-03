import type { SpotlightShipment, TriageActionContext } from "@/utils/dashboard-metrics";

export interface DashboardSpotlightShipmentProps {
  spotlight: SpotlightShipment | null | undefined;
  context?: TriageActionContext | null;
}
