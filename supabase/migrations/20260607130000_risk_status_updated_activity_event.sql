-- Operator risk status changes for the shipment activity timeline feed.
do $$ begin
  alter type public.shipment_activity_event_type add value 'risk_status_updated';
exception
  when duplicate_object then null;
end $$;
