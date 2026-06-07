import { ExternalLink } from "lucide-react";
import type { ShipmentCommercialHeaderSource } from "../types";
import { SHIPMENT_DETAIL_GRID_FIELDS } from "../utils";
import {
  CARRIER_TRACKING_LINK_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_ACCENT_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_LABEL_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_CELL_VALUE_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_GRID_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_GRID_SECTION_CLASS,
} from "./constants";
import { getCarrierTrackingUrl } from "./utils";

export function ShipmentCommercialDetailsGrid({ source }: { source: ShipmentCommercialHeaderSource }) {
  return (
    <section className={SHIPMENT_COMMERCIAL_DETAILS_GRID_SECTION_CLASS} aria-label="Commercial details">
      <dl className={SHIPMENT_COMMERCIAL_DETAILS_GRID_CLASS}>
        {SHIPMENT_DETAIL_GRID_FIELDS.map((field) => {
          const raw = source[field.key];
          const value = field.format(typeof raw === "string" ? raw : raw == null ? null : String(raw));
          const trackingUrl =
            field.key === "freight_booking_carrier" ? getCarrierTrackingUrl(raw as string | null) : null;

          return (
            <div key={field.key} className={SHIPMENT_COMMERCIAL_DETAILS_CELL_CLASS}>
              <dt className={SHIPMENT_COMMERCIAL_DETAILS_CELL_LABEL_CLASS}>{field.label}</dt>
              <dd
                className={`${SHIPMENT_COMMERCIAL_DETAILS_CELL_VALUE_CLASS}${trackingUrl ? " flex items-center justify-between gap-2" : ""}`}
                title={value !== "—" ? value : undefined}
              >
                <span className={trackingUrl ? "min-w-0 truncate" : undefined}>{value}</span>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${value} tracking portal`}
                    className={CARRIER_TRACKING_LINK_CLASS}
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  </a>
                ) : null}
              </dd>
              <span className={SHIPMENT_COMMERCIAL_DETAILS_CELL_ACCENT_CLASS} aria-hidden />
            </div>
          );
        })}
      </dl>
    </section>
  );
}
