-- Shipment commercial edit activity for operator timeline + notifications.
alter type public.shipment_activity_event_type add value if not exists 'shipment_edited';
