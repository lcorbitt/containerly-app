-- Clarify relationship: many workflow/sync rows can point at one physical container; `containers` holds latest API snapshot.
comment on column public.tracking_requests.container_id is
  'Physical container row this line syncs into. Several tracking_requests may share one container_id; `containers` stores the latest merged carrier data from the most recent successful sync.';
