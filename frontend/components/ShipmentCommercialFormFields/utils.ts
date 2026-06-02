import type { ShipmentCommercialHeader, ShipmentLineInput } from "@shared/dto/logistics.dto";
import type { ShipmentImportDraft } from "@/utils/shipment-import";
import type { ShipmentCommercialFormSource, ShipmentCommercialFormValues } from "./types";

export function emptyFormValues(): ShipmentCommercialFormValues {
  return {
    orderNumber: "",
    carrierBookingNumber: "",
    containerNumber: "",
    customerName: "",
    country: "",
    portOfLoading: "",
    portOfDestination: "",
    etd: "",
    eta: "",
    carrier: "",
    vessel: "",
    voyage: "",
    healthCert: "",
    tradeTerms: "",
  };
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const s = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    return new Date(s).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function formValuesFromSource(source: ShipmentCommercialFormSource): ShipmentCommercialFormValues {
  return {
    orderNumber: source.order_number ?? "",
    carrierBookingNumber: source.carrier_booking_number ?? "",
    containerNumber: source.container_number ?? "",
    customerName: source.customer_name ?? "",
    country: source.country ?? "",
    portOfLoading: source.port_of_loading ?? "",
    portOfDestination: source.port_of_destination ?? "",
    etd: isoToDateInput(source.estimated_departure_at),
    eta: isoToDateInput(source.estimated_arrival_at),
    carrier: source.freight_booking_carrier ?? "",
    vessel: source.vessel ?? "",
    voyage: source.voyage ?? "",
    healthCert: source.health_certificate_no ?? "",
    tradeTerms: source.trade_terms ?? "",
  };
}

export function formValuesFromImportDraft(draft: ShipmentImportDraft): ShipmentCommercialFormValues {
  return {
    orderNumber: draft.orderNumber,
    carrierBookingNumber: draft.carrierBookingNumber,
    containerNumber: draft.containerNumber,
    customerName: draft.customerName,
    country: draft.country,
    portOfLoading: draft.portOfLoading,
    portOfDestination: draft.portOfDestination,
    etd: draft.etd,
    eta: draft.eta,
    carrier: draft.carrier,
    vessel: draft.vessel,
    voyage: draft.voyage,
    healthCert: draft.healthCert,
    tradeTerms: draft.tradeTerms,
  };
}

export function validateFormValues(values: ShipmentCommercialFormValues): string | null {
  if (!values.orderNumber.trim()) return "Order number is required.";
  if (!values.carrierBookingNumber.trim()) return "Carrier booking number is required.";
  if (!values.containerNumber.trim()) return "Container number is required.";
  return null;
}

export function formValuesToCommercialHeader(values: ShipmentCommercialFormValues): ShipmentCommercialHeader {
  return {
    order_number: values.orderNumber.trim(),
    carrier_booking_number: values.carrierBookingNumber.trim(),
    container_number: values.containerNumber.trim(),
    customer_name: values.customerName.trim() || null,
    country: values.country.trim() || null,
    port_of_loading: values.portOfLoading.trim() || null,
    port_of_destination: values.portOfDestination.trim() || null,
    estimated_departure_at: values.etd ? new Date(values.etd).toISOString() : null,
    estimated_arrival_at: values.eta ? new Date(values.eta).toISOString() : null,
    freight_booking_carrier: values.carrier.trim() || null,
    vessel: values.vessel.trim() || null,
    voyage: values.voyage.trim() || null,
    health_certificate_no: values.healthCert.trim() || null,
    trade_terms: values.tradeTerms.trim() || null,
  };
}

export function formValuesToIdentityLine(values: ShipmentCommercialFormValues): ShipmentLineInput {
  const header = formValuesToCommercialHeader(values);
  return {
    order_number: header.order_number,
    carrier_booking_number: header.carrier_booking_number,
    container_number: header.container_number,
    customer_name: header.customer_name,
    country: header.country,
    port_of_loading: header.port_of_loading,
    port_of_destination: header.port_of_destination,
    estimated_departure_at: header.estimated_departure_at,
    estimated_arrival_at: header.estimated_arrival_at,
    freight_booking_carrier: header.freight_booking_carrier,
    vessel: header.vessel,
    voyage: header.voyage,
    health_certificate_no: header.health_certificate_no,
    trade_terms: header.trade_terms,
    sort_order: 0,
  };
}
