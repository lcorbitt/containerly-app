import type { ShipmentCommercialDetails } from "@shared/dto/logistics.dto";
import type { ReportSummary } from "@shared/dto/shipment.dto";
import type { ShipmentCommercialHeaderSource } from "@/components/ShipmentCommercialHeader";

export function commercialDetailsToHeaderSource(
  details: ShipmentCommercialDetails,
  summary: ReportSummary,
): ShipmentCommercialHeaderSource {
  const line = details.lines[0];

  return {
    customer_name: details.customer_name,
    order_number:
      details.order_number?.trim() ||
      summary.order_number?.trim() ||
      line?.order_number?.trim() ||
      null,
    carrier_booking_number:
      details.carrier_booking_number?.trim() ||
      line?.carrier_booking_number?.trim() ||
      null,
    container_number:
      details.container_number?.trim() ||
      summary.container_number?.trim() ||
      line?.container_number?.trim() ||
      null,
    country: details.country ?? line?.country ?? null,
    port_of_loading: details.port_of_loading ?? line?.port_of_loading ?? null,
    port_of_destination: details.port_of_destination ?? line?.port_of_destination ?? null,
    estimated_departure_at: details.estimated_departure_at ?? line?.estimated_departure_at ?? null,
    estimated_arrival_at: details.estimated_arrival_at ?? line?.estimated_arrival_at ?? null,
    freight_booking_carrier: details.freight_booking_carrier ?? line?.freight_booking_carrier ?? null,
    vessel: details.vessel ?? line?.vessel ?? null,
    voyage: details.voyage ?? line?.voyage ?? null,
    health_certificate_no: details.health_certificate_no ?? line?.health_certificate_no ?? null,
    trade_terms: details.trade_terms ?? line?.trade_terms ?? null,
  };
}
