export interface RouteEndpointDate {
  label: "ETD" | "ETA";
  date: string;
  iso: string;
}

export interface ShipmentCommercialRouteLaneProps {
  origin: string | null;
  destination: string | null;
  estimatedDepartureAt?: string | null;
  estimatedArrivalAt?: string | null;
  className?: string;
  /** `compact` — inline route for the summary bar. `detailed` — origin/destination columns. */
  variant?: "compact" | "detailed";
}
