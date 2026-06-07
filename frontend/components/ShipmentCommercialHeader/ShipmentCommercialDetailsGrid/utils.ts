const CARRIER_TRACKING_URLS: Record<string, string> = {
  MSC: "https://www.msc.com/en/track-a-shipment",
  MAERSK: "https://www.maersk.com/tracking/",
  HAPAG_LLOYD: "https://www.hapag-lloyd.com/en/online-business/track/track-by-booking-solution.html",
  HMM: "https://www.hmm21.com/e-service/general/trackNTrace/TrackNTrace.do",
  ONE: "https://ecomm.one-line.com/one-ecom/manage-shipment/track",
  EVERGREEN: "https://www.shipmentlink.com/servlet/TDB1_CargoTracking.do",
  CMA_CGM: "https://www.cma-cgm.com/ebusiness/tracking",
  COSCO: "https://elines.coscoshipping.com/ebusiness/cargoTracking",
  ZIM: "https://www.zim.com/tools/track-a-shipment",
  YANG_MING: "https://www.yangming.com/e-service/track_trace/track_trace_cargo_tracking.aspx",
};

function normalizeCarrierKey(carrier: string): string {
  return carrier
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

/** Resolve a hard-coded carrier tracking portal URL from a freight booking carrier name. */
export function getCarrierTrackingUrl(carrier: string | null | undefined): string | null {
  const trimmed = carrier?.trim();
  if (!trimmed) return null;

  const normalized = normalizeCarrierKey(trimmed);
  if (CARRIER_TRACKING_URLS[normalized]) {
    return CARRIER_TRACKING_URLS[normalized];
  }

  for (const [key, url] of Object.entries(CARRIER_TRACKING_URLS)) {
    const label = key.replace(/_/g, " ");
    if (normalized.includes(key) || key.includes(normalized) || normalized.includes(label.replace(/\s/g, ""))) {
      return url;
    }
  }

  return null;
}
