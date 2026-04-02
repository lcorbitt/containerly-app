-- containers.location already stores the full JSON Cargo `data` snapshot as jsonb.
-- Edge sync (`buildJsonCargoLocation`) maps all documented fields plus any extra primitive keys from the provider.
comment on column public.containers.location is
  'JSON Cargo provider snapshot: container identity, route, ETAs/ATDs, locations, customs_clearance, B/L, vessels, last_updated, etc.';
