export type ShipmentCommercialFormValues = {
  orderNumber: string;
  carrierBookingNumber: string;
  containerNumber: string;
  customerName: string;
  country: string;
  portOfLoading: string;
  portOfDestination: string;
  etd: string;
  eta: string;
  carrier: string;
  vessel: string;
  voyage: string;
  healthCert: string;
  tradeTerms: string;
};

export type ShipmentCommercialFormSource = {
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  customer_name: string | null;
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
};
