export interface MockMilestone {
  label: string;
  meta: string;
  state: "done" | "current" | "upcoming";
}

export interface MockDocument {
  name: string;
  status: "approved" | "awaiting";
}

export const MOCK_SHIPMENT_REF = "MSKU 4821630";
export const MOCK_ROUTE = "Shanghai to Long Beach";
export const MOCK_ETA = "ETA Jun 14";

export const mockMilestones: readonly MockMilestone[] = [
  { label: "Booking confirmed", meta: "May 28", state: "done" },
  { label: "Departed origin port", meta: "Jun 1", state: "done" },
  { label: "In transit", meta: "On the water", state: "current" },
  { label: "Arrival at destination", meta: "Jun 14", state: "upcoming" },
];

export const mockDocuments: readonly MockDocument[] = [
  { name: "Packing list", status: "approved" },
  { name: "Commercial invoice", status: "awaiting" },
];
