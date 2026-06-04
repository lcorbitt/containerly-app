-- Converge the two paths into a portal: operator-initiated `customer_invites` and
-- customer-initiated `shipment_customer_access_requests`. They must not both sit "pending"
-- for the same (shipment, email) — access is one idempotent entitlement, the first path to
-- complete wins and resolves the other (mirrors GitHub/Google/Slack invite-vs-request).
--
-- `shipment_customer_access_requests` already enforces one pending request per
-- (shipment_id, lower(requester_email)). This migration adds the matching guard for invites
-- and cleans up rows that were orphaned before the auto-converge logic existed.

-- 1. Dedupe existing pending invites so the partial unique index can be created: keep the
--    newest pending invite per (shipment, lower(email)), revoke the rest.
with ranked as (
  select
    id,
    row_number() over (
      partition by shipment_id, lower(invited_email)
      order by created_at desc, id desc
    ) as rn
  from public.customer_invites
  where status = 'pending'
)
update public.customer_invites ci
set status = 'revoked'
from ranked
where ci.id = ranked.id
  and ranked.rn > 1;

-- 2. One pending invite per (shipment, email), mirroring the access-requests index.
create unique index if not exists customer_invites_pending_email_uniq
  on public.customer_invites (shipment_id, lower(invited_email))
  where status = 'pending';

-- 3. One-time cleanup: approve still-pending access requests whose access was already granted
--    through the invite path (accepted invite for the same shipment + email).
update public.shipment_customer_access_requests r
set
  status = 'approved',
  resolved_at = now()
where r.status = 'pending'
  and exists (
    select 1
    from public.customer_invites ci
    where ci.shipment_id = r.shipment_id
      and lower(ci.invited_email) = lower(r.requester_email)
      and ci.status = 'accepted'
  );

-- 4. One-time cleanup: approve still-pending access requests that already have an active grant
--    for the same shipment + email (e.g. allowlist / claim paths).
update public.shipment_customer_access_requests r
set
  status = 'approved',
  resolved_at = now()
where r.status = 'pending'
  and exists (
    select 1
    from public.shipment_customer_access sca
    join public.profiles p on p.id = sca.customer_user_id
    where sca.shipment_id = r.shipment_id
      and sca.revoked_at is null
      and lower(p.email) = lower(r.requester_email)
  );
