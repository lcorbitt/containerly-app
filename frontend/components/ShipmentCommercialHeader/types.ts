export interface ShipmentCommercialHeaderSource {
  customer_name: string | null;
  consignee: string | null;
  order_number: string | null;
  carrier_booking_number: string | null;
  container_number: string | null;
  country: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  freight_booking_carrier: string | null;
  vessel: string | null;
  voyage: string | null;
  health_certificate_no: string | null;
  trade_terms: string | null;
}

export interface ShipmentCommercialHeaderProps {
  source: ShipmentCommercialHeaderSource;
}
