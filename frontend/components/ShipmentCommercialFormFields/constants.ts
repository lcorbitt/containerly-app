export const SHIPMENT_COMMERCIAL_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500";

export const SHIPMENT_COMMERCIAL_FIELD_CLASS =
  "mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

export const SHIPMENT_COMMERCIAL_TITLE_FIELD_DEFS = [
  { key: "orderNumber" as const, label: "Order No", required: true },
  { key: "customerName" as const, label: "Customer" },
  { key: "consignee" as const, label: "Consignee" },
];

export const SHIPMENT_COMMERCIAL_GRID_FIELD_DEFS = [
  { key: "carrierBookingNumber" as const, label: "Carrier Booking No.", required: true },
  { key: "containerNumber" as const, label: "Container No.", required: true, mono: true },
  { key: "country" as const, label: "Country" },
  { key: "portOfLoading" as const, label: "Port of Loading" },
  { key: "portOfDestination" as const, label: "Port of Destination" },
  { key: "etd" as const, label: "Est Date of Departure", type: "date" as const },
  { key: "eta" as const, label: "Est Date of Arrival", type: "date" as const },
  { key: "carrier" as const, label: "Freight Booking Carrier" },
  { key: "vessel" as const, label: "Vessel" },
  { key: "voyage" as const, label: "Voyage" },
  { key: "healthCert" as const, label: "Health Certificate No" },
  { key: "tradeTerms" as const, label: "Trade Terms" },
];
