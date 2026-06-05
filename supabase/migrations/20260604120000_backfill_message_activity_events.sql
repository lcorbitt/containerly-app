-- Backfill shipment timeline rows for customer-visible messages that never got activity events
-- (e.g. customer portal posts without author_display_name caused a silent insert failure).

insert into public.shipment_activity_events (
  shipment_id,
  event_type,
  body,
  actor_kind,
  actor_user_id,
  metadata,
  occurred_at
)
select
  coalesce(rm.shipment_id, c.shipment_id) as shipment_id,
  case
    when rm.author_kind = 'customer' then 'customer_message'::public.shipment_activity_event_type
    else 'operator_message'::public.shipment_activity_event_type
  end as event_type,
  coalesce(nullif(trim(rm.body), ''), 'Message posted') as body,
  case
    when rm.author_kind = 'customer' then 'customer'::public.shipment_activity_actor_kind
    else 'operator'::public.shipment_activity_actor_kind
  end as actor_kind,
  rm.author_user_id,
  jsonb_build_object(
    'message_id', rm.id,
    'author_display_name',
      coalesce(
        nullif(trim(rm.author_display_name), ''),
        case when rm.author_kind = 'customer' then 'Customer' else 'Team member' end
      ),
    'message_preview',
      left(coalesce(nullif(trim(rm.body), ''), 'Message posted'), 120),
    'container_id', rm.container_id,
    'scope', case when rm.container_id is not null then 'container' else 'shipment' end
  ) as metadata,
  rm.created_at as occurred_at
from public.report_messages rm
left join public.containers c on c.id = rm.container_id
where rm.is_internal = false
  and coalesce(rm.shipment_id, c.shipment_id) is not null
  and not exists (
    select 1
    from public.shipment_activity_events sae
    where sae.metadata->>'message_id' = rm.id::text
      and sae.event_type in ('customer_message', 'operator_message')
  );
