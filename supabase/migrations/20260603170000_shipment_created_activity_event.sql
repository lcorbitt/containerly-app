-- Shipment creation milestone for the activity timeline feed.
do $$ begin
  alter type public.shipment_activity_event_type add value 'shipment_created';
exception
  when duplicate_object then null;
end $$;
