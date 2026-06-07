import type { ShipmentCommercialHeaderSource } from "../types";

export interface ShipmentCommercialSummaryBarProps {
  source: Pick<ShipmentCommercialHeaderSource, "customer_name" | "order_number" | "port_of_loading" | "port_of_destination" | "estimated_departure_at" | "estimated_arrival_at">;
}
