-- Local dev seed: JBS Foods + three accounts (one per access tier).
-- Runs after migrations on `supabase db reset` / first `supabase start`.
--
-- 1) Platform superadmin — profiles.role = superadmin, NOT in organization_members.
--    RLS treats you as bypassing tenant checks (is_superadmin()). Use for engineering / ops only.
-- 2) Org admin — profiles.role = user, organization_members.role = admin for JBS Foods.
-- 3) Org member — profiles.role = user, organization_members.role = member for JBS Foods.
--
-- Password for all three: password
--
-- Log in (e.g. http://localhost:3000/login):
--   platform@containerly.com   — you (engineer); no org row; sees all orgs via RLS bypass
--   admin@jbsfoods.com         — customer org administrator
--   member@jbsfoods.com        — customer org member
--   importer@demo.com          — importer customer (no org); grant on demo MSCU1234567 → workspace /requests/<id> (shared tracking /shipments/hub/<shipmentId>; operator hub /shipments/<shipmentId>)
--
-- GoTrue scans auth token columns as non-null strings; use '' not SQL NULL (otherwise login returns
-- "Database error querying schema").

create extension if not exists "pgcrypto";

do $$
declare
  v_org_id uuid := 'a0000001-0000-4000-8000-000000000001';
  v_member_user_id uuid := 'a0000002-0000-4000-8000-000000000002';
  v_platform_user_id uuid := 'a0000003-0000-4000-8000-000000000003';
  v_org_admin_user_id uuid := 'a0000004-0000-4000-8000-000000000004';
  v_importer_user_id uuid := 'a0000005-0000-4000-8000-000000000005';
  v_pw text := crypt('password', gen_salt('bf'));
begin
  -- Tier 3: org member (global user, tenant member)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_member_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'member@jbsfoods.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Jordan Member"}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'member@jbsfoods.com',
    v_member_user_id,
    jsonb_build_object('sub', v_member_user_id::text, 'email', 'member@jbsfoods.com'),
    'email',
    now(),
    now(),
    now()
  );

  -- Tier 1: platform superadmin — no organization_members row (not a “customer” of any tenant)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_platform_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'platform@containerly.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Pat Platform"}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'platform@containerly.com',
    v_platform_user_id,
    jsonb_build_object('sub', v_platform_user_id::text, 'email', 'platform@containerly.com'),
    'email',
    now(),
    now(),
    now()
  );

  update public.profiles
  set role = 'superadmin'
  where id = v_platform_user_id;

  -- Tier 2: org admin (global user only; power comes from organization_members.admin)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_org_admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@jbsfoods.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Avery Admin"}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'admin@jbsfoods.com',
    v_org_admin_user_id,
    jsonb_build_object('sub', v_org_admin_user_id::text, 'email', 'admin@jbsfoods.com'),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.organizations (id, name, slug)
  values (v_org_id, 'JBS Foods', 'jbs-foods');

  -- Tenant admin for JBS Foods: login admin@jbsfoods.com / password — organization_members.role must be 'admin'
  -- (profiles.role stays 'user'; tenant privileges come from this row, not profiles.role).
  insert into public.organization_members (organization_id, user_id, role) values
    (v_org_id, v_member_user_id, 'member'),
    (v_org_id, v_org_admin_user_id, 'admin');

  if (select count(*)::int from public.organization_members where organization_id = v_org_id and role = 'admin') < 1 then
    raise exception 'seed.sql: JBS Foods (%) must have at least one organization_members row with role = admin', v_org_id;
  end if;

  update public.profiles
  set role = 'user'
  where id in (v_org_admin_user_id, v_member_user_id);

  -- Importer (authenticated customer; not an org member)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_importer_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'importer@demo.com',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Chris Importer"}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    'importer@demo.com',
    v_importer_user_id,
    jsonb_build_object('sub', v_importer_user_id::text, 'email', 'importer@demo.com'),
    'email',
    now(),
    now(),
    now()
  );

  update public.profiles
  set account_kind = 'customer'
  where id = v_importer_user_id;
end $$;

-- Three demo shipments (same org): shipments.created_by = org admin; containers.shipment_id; tracking_requests (container_id).
-- MSCU1000001 — just started (1 timeline event); MSCU2000002 — early origin (6 events);
-- MSCU1234567 — full completed journey (~24 events) + importer grant + alerts/messages below.
insert into public.shipments (id, organization_id, created_by, assignee_user_id, reference, bill_of_lading, shipping_line) values
  ('c0000001-0000-4000-8000-000000000099', 'a0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', 'a0000002-0000-4000-8000-000000000002', 'MSCU1234567', null, 'MSC'),
  ('c0000001-0000-4000-8000-000000000098', 'a0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', 'a0000004-0000-4000-8000-000000000004', 'MSCU1000001', null, 'MSC'),
  ('c0000001-0000-4000-8000-000000000097', 'a0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', 'a0000004-0000-4000-8000-000000000004', 'MSCU2000002', null, 'MSC');

insert into public.containers (
  id,
  organization_id,
  shipment_id,
  container_number,
  normalized_number,
  carrier,
  status,
  location,
  raw_external,
  last_synced_at,
  last_checked_at
) values (
  'b0000001-0000-4000-8000-000000000010',
  'a0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000099',
  'MSCU1234567',
  'MSCU1234567',
  'MSC',
  'Shipment complete',
  $SHIP_LOC${
    "container_id": "MSCU1234567",
    "container_type": "40' HIGH CUBE REEFER",
    "container_status": "Shipment complete",
    "tare": 3900,
    "shipping_line_name": "Mediterranean Shipping Company",
    "shipping_line_id": "0015",
    "shipped_from": "SHANGHAI, CN",
    "shipped_from_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4",
    "shipped_to": "LOS ANGELES, US",
    "shipped_to_terminal": "APM TERMINALS PIER 400",
    "loading_port": "SHANGHAI, CN",
    "discharging_port": "LOS ANGELES, US",
    "last_location": "LOS ANGELES, US",
    "last_location_terminal": "APM TERMINALS PIER 400",
    "next_location": "LOS ANGELES, US — CY depot",
    "next_location_terminal": "APM EMPTY DEPOT",
    "atd_origin": "2025-01-06 18:00",
    "eta_final_destination": "2025-02-05 00:00",
    "atd_last_location": "2025-02-03 08:00",
    "eta_next_destination": "2025-02-03 12:00",
    "customs_clearance": "2025-01-26 16:00",
    "timestamp_of_last_location": "2025-02-04 10:00",
    "last_movement_timestamp": "2025-02-04 10:00",
    "last_updated": "2025-02-04 10:00",
    "last_vessel_name": "MSC LORETO",
    "last_voyage_number": "FY428W",
    "current_vessel_name": "MSC LORETO",
    "current_voyage_number": "FY428W",
    "bill_of_lading": "MEDUSH914201"
  }$SHIP_LOC$::jsonb,
  $SHIP_RAW${
    "data": {
      "container_id": "MSCU1234567",
      "container_type": "40' HIGH CUBE REEFER",
      "container_status": "Shipment complete",
      "shipping_line_name": "Mediterranean Shipping Company",
      "shipping_line_id": "0015",
      "tare": 3900,
      "shipped_from": "SHANGHAI, CN",
      "shipped_from_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4",
      "shipped_to": "LOS ANGELES, US",
      "shipped_to_terminal": "APM TERMINALS PIER 400",
      "atd_origin": "2025-01-06 18:00",
      "eta_final_destination": "2025-02-05 00:00",
      "last_location": "LOS ANGELES, US",
      "last_location_terminal": "APM TERMINALS PIER 400",
      "next_location": "LOS ANGELES, US — CY depot",
      "next_location_terminal": "APM EMPTY DEPOT",
      "atd_last_location": "2025-02-03 08:00",
      "eta_next_destination": "2025-02-03 12:00",
      "timestamp_of_last_location": "2025-02-04 10:00",
      "last_movement_timestamp": "2025-02-04 10:00",
      "loading_port": "SHANGHAI, CN",
      "discharging_port": "LOS ANGELES, US",
      "customs_clearance": "2025-01-26 16:00",
      "bill_of_lading": "MEDUSH914201",
      "last_vessel_name": "MSC LORETO",
      "last_voyage_number": "FY428W",
      "current_vessel_name": "MSC LORETO",
      "current_voyage_number": "FY428W",
      "last_updated": "2025-02-04 10:00"
    }
  }$SHIP_RAW$::jsonb,
  now(),
  now()
);

insert into public.containers (
  id,
  organization_id,
  shipment_id,
  container_number,
  normalized_number,
  carrier,
  status,
  location,
  raw_external,
  last_synced_at,
  last_checked_at
) values (
  'b0000001-0000-4000-8000-000000000012',
  'a0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000098',
  'MSCU1000001',
  'MSCU1000001',
  'MSC',
  'Booking confirmed',
  $LOC_A${
    "container_id": "MSCU1000001",
    "container_type": "40' HIGH CUBE",
    "container_status": "Booking confirmed",
    "shipping_line_name": "Mediterranean Shipping Company",
    "shipped_from": "NINGBO, CN",
    "shipped_to": "LONG BEACH, US",
    "loading_port": "NINGBO, CN",
    "discharging_port": "LONG BEACH, US",
    "last_location": "NINGBO, CN",
    "last_location_terminal": "NINGBO ZHOUSHAN — PHASE 3",
    "last_updated": "2026-04-04 08:00"
  }$LOC_A$::jsonb,
  $RAW_A${"data": {"container_id": "MSCU1000001", "container_status": "Booking confirmed", "last_updated": "2026-04-04T08:00:00Z"}}$RAW_A$::jsonb,
  now(),
  now()
);

insert into public.containers (
  id,
  organization_id,
  shipment_id,
  container_number,
  normalized_number,
  carrier,
  status,
  location,
  raw_external,
  last_synced_at,
  last_checked_at
) values (
  'b0000001-0000-4000-8000-000000000014',
  'a0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000097',
  'MSCU2000002',
  'MSCU2000002',
  'MSC',
  'Loaded on vessel',
  $LOC_B${
    "container_id": "MSCU2000002",
    "container_type": "40' HIGH CUBE REEFER",
    "container_status": "Loaded on vessel",
    "shipping_line_name": "Mediterranean Shipping Company",
    "shipped_from": "SHANGHAI, CN",
    "shipped_to": "LOS ANGELES, US",
    "loading_port": "SHANGHAI, CN",
    "discharging_port": "LOS ANGELES, US",
    "last_location": "SHANGHAI, CN",
    "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4",
    "last_vessel_name": "MSC IRINA",
    "current_vessel_name": "MSC IRINA",
    "last_updated": "2026-03-28 14:00"
  }$LOC_B$::jsonb,
  $RAW_B${"data": {"container_id": "MSCU2000002", "container_status": "Loaded on vessel", "last_vessel_name": "MSC IRINA", "last_updated": "2026-03-28T14:00:00Z"}}$RAW_B$::jsonb,
  now(),
  now()
);

update public.containers
set enrichment = jsonb_build_object(
  'source_last_fetched_at', now(),
  'vessel_ais', jsonb_build_object(
    'name', 'MSC LORETO',
    'lat', 22.45,
    'lon', 118.28,
    'speed', 12.4,
    'last_position_UTC', '2025-02-04T10:00:00Z',
    'eta_UTC', '2025-02-08T12:00:00Z'
  ),
  'vessel_specs', jsonb_build_object('teu', '4500', 'type_specific', 'Container Ship')
)
where id = 'b0000001-0000-4000-8000-000000000010';

insert into public.tracking_requests (
  id,
  organization_id,
  created_by,
  container_id,
  container_number,
  normalized_number,
  status,
  last_sync_at,
  next_check_at
) values (
  'b0000001-0000-4000-8000-000000000011',
  'a0000001-0000-4000-8000-000000000001',
  'a0000004-0000-4000-8000-000000000004',
  'b0000001-0000-4000-8000-000000000010',
  'MSCU1234567',
  'MSCU1234567',
  'completed',
  now(),
  now() + interval '7 days'
);

insert into public.tracking_requests (
  id,
  organization_id,
  created_by,
  container_id,
  container_number,
  normalized_number,
  status,
  last_sync_at,
  next_check_at
) values
  (
    'b0000001-0000-4000-8000-000000000013',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'b0000001-0000-4000-8000-000000000012',
    'MSCU1000001',
    'MSCU1000001',
    'active',
    now(),
    now() + interval '1 day'
  ),
  (
    'b0000001-0000-4000-8000-000000000015',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'b0000001-0000-4000-8000-000000000014',
    'MSCU2000002',
    'MSCU2000002',
    'active',
    now(),
    now() + interval '1 day'
  );

-- Shipment-level collaborators (assignee is a0000002 on MSCU1234567 shipment).
insert into public.shipment_participants (shipment_id, user_id) values
  ('c0000001-0000-4000-8000-000000000099', 'a0000004-0000-4000-8000-000000000004'),
  ('c0000001-0000-4000-8000-000000000098', 'a0000002-0000-4000-8000-000000000002'),
  ('c0000001-0000-4000-8000-000000000097', 'a0000002-0000-4000-8000-000000000002');

-- Full demo journey (Shanghai → LA): mix of event_type values (WEBHOOK, SYNC, …) for UI phases; final carrier-facing status matches containers.status.
insert into public.tracking_events (
  container_id,
  tracking_request_id,
  event_type,
  status,
  location,
  occurred_at,
  raw_payload
) values
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'WEBHOOK',
    'Webhook — carrier data linked',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '25 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Booking confirmed',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '24 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Packed — cartons sealed at shipper warehouse',
    '{"last_location": "KUNSHAN, CN", "last_location_terminal": "JBS FOODS — EXPORT CFS"}'::jsonb,
    now() - interval '23 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Gate out empty for loading',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '22 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Rail arrival at quay',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "INTERMODAL RAMP — NANHUI"}'::jsonb,
    now() - interval '21 days 18 hours',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Loaded on vessel',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '21 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Vessel departed origin',
    '{"last_location": "EAST CHINA SEA"}'::jsonb,
    now() - interval '20 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'In transit — ocean',
    '{"last_location": "PACIFIC OCEAN"}'::jsonb,
    now() - interval '18 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Discharged at transshipment hub',
    '{"last_location": "BUSAN, KR", "last_location_terminal": "HMM PUSAN NEW PORT"}'::jsonb,
    now() - interval '15 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Reloaded on mainline vessel',
    '{"last_location": "BUSAN, KR", "last_location_terminal": "HMM PUSAN NEW PORT"}'::jsonb,
    now() - interval '14 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Customs exam scheduled (T/S)',
    '{"last_location": "BUSAN, KR", "last_location_terminal": "CUSTOMS EXAM AREA"}'::jsonb,
    now() - interval '13 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'In transit — Pacific main leg',
    '{"last_location": "PACIFIC OCEAN"}'::jsonb,
    now() - interval '12 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Delayed — awaiting berth window',
    '{"last_location": "LOS ANGELES ANCHORAGE"}'::jsonb,
    now() - interval '10 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Vessel arrived POD',
    '{"last_location": "LOS ANGELES, US"}'::jsonb,
    now() - interval '9 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Berthed alongside',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '8 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Discharged from vessel',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '7 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Customs clearance released',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "CBP — LONG BEACH"}'::jsonb,
    now() - interval '6 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'CFS available for pickup',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "OFF-DOCK CFS"}'::jsonb,
    now() - interval '5 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Truck dispatched for delivery',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "PIER 400 — OUTGATE"}'::jsonb,
    now() - interval '4 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Delivered to consignee door',
    '{"last_location": "COMMERCE, CA", "last_location_terminal": "JBS FOODS — DC 7"}'::jsonb,
    now() - interval '3 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Rail arrived at inland ramp',
    '{"last_location": "SAN BERNARDINO, CA", "last_location_terminal": "BNSF INTERMODAL"}'::jsonb,
    now() - interval '2 days 12 hours',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Devanning complete — storage yard',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM EMPTY DEPOT"}'::jsonb,
    now() - interval '2 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Empty received at CY',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '36 hours',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Shipment complete',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '24 hours',
    '{}'::jsonb
  );

-- Just started: single carrier-linked event (today).
insert into public.tracking_events (
  container_id,
  tracking_request_id,
  event_type,
  status,
  location,
  occurred_at,
  raw_payload
) values (
  'b0000001-0000-4000-8000-000000000012',
  'b0000001-0000-4000-8000-000000000013',
  'WEBHOOK',
  'Webhook — carrier data linked',
  '{"last_location": "NINGBO, CN", "last_location_terminal": "NINGBO ZHOUSHAN — PHASE 3"}'::jsonb,
  now() - interval '2 hours',
  '{}'::jsonb
);

-- In progress: first six milestones of the Shanghai → LA pattern (origin / loading).
insert into public.tracking_events (
  container_id,
  tracking_request_id,
  event_type,
  status,
  location,
  occurred_at,
  raw_payload
) values
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'WEBHOOK',
    'Webhook — carrier data linked',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '18 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Booking confirmed',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '17 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Packed — cartons sealed at shipper warehouse',
    '{"last_location": "KUNSHAN, CN", "last_location_terminal": "JBS FOODS — EXPORT CFS"}'::jsonb,
    now() - interval '16 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Gate out empty for loading',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '15 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Rail arrival at quay',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "INTERMODAL RAMP — NANHUI"}'::jsonb,
    now() - interval '14 days 18 hours',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Loaded on vessel',
    '{"last_location": "SHANGHAI, CN", "last_location_terminal": "SHANGHAI CNTS — YANGSHAN PHASE 4"}'::jsonb,
    now() - interval '14 days',
    '{}'::jsonb
  );

insert into public.shipment_customer_access (
  id,
  organization_id,
  shipment_id,
  customer_user_id,
  invite_id,
  visibility_settings,
  operator_overrides,
  configuration_reminder_due_at,
  profile_completed_at,
  revoked_at,
  created_at,
  updated_at
) values (
  'b0000001-0000-4000-8000-0000000000f2',
  'a0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000099',
  'a0000005-0000-4000-8000-000000000005',
  null,
  '{"include_alerts": true, "include_raw_external": false}'::jsonb,
  '{}'::jsonb,
  now() + interval '14 days',
  null,
  null,
  now(),
  now()
);

insert into public.report_messages (
  container_id,
  author_user_id,
  author_kind,
  is_internal,
  body
) values (
  'b0000001-0000-4000-8000-000000000010',
  'a0000004-0000-4000-8000-000000000004',
  'member',
  true,
  'Internal: chassis pre-pull arranged for LA terminal.'
);

insert into public.report_messages (
  container_id,
  author_kind,
  is_internal,
  author_display_name,
  body
) values (
  'b0000001-0000-4000-8000-000000000010',
  'customer',
  false,
  'Alex (JBS)',
  'Thanks — please confirm once the container is available for pickup.'
);

-- Demo alerts (side nav notifications): org broadcasts + per-recipient inbox rows.
-- alert_type (stable enums): SHIPMENT_DELAYED, STATUS_EXCEPTION, INFO, ASSIGNMENT_ASSIGNEE,
-- ASSIGNMENT_PARTICIPANT, MESSAGE_NEW, MESSAGE_REPLY, DOCUMENT_UPLOADED, ORG_INVITE_ACCEPTED,
-- CUSTOMER_JOINED_ORG, BOL_IMPORTED, TRACKING_SYNC_OK (+ add more in application code as needed).
insert into public.alerts (
  id,
  organization_id,
  tracking_request_id,
  container_id,
  alert_type,
  severity,
  message,
  details,
  recipient_user_id,
  actor_user_id,
  acknowledged_at,
  acknowledged_by,
  created_at
) values
  (
    'c0000001-0000-4000-8000-000000000001',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'SHIPMENT_DELAYED',
    'warning',
    'MSCU1234567: carrier reported a schedule slip at transshipment (demo seed).',
    '{"seed": true}'::jsonb,
    null,
    null,
    null,
    null,
    now() - interval '3 hours'
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'STATUS_EXCEPTION',
    'critical',
    'MSCU1234567: customs documentation flagged for review (demo seed).',
    '{"seed": true}'::jsonb,
    null,
    null,
    null,
    null,
    now() - interval '90 minutes'
  ),
  (
    'c0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'INFO',
    'info',
    'Weekly digest: no action required for this shipment (demo seed).',
    '{"seed": true}'::jsonb,
    null,
    null,
    now() - interval '2 days',
    'a0000004-0000-4000-8000-000000000004',
    now() - interval '5 days'
  ),
  (
    'c0000001-0000-4000-8000-000000000004',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'ASSIGNMENT_ASSIGNEE',
    'info',
    'Avery Admin made you the assignee of shipment MSCU1234567.',
    '{"seed": true, "shipment_reference": "MSCU1234567"}'::jsonb,
    'a0000002-0000-4000-8000-000000000002',
    'a0000004-0000-4000-8000-000000000004',
    null,
    null,
    now() - interval '45 minutes'
  ),
  (
    'c0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'ASSIGNMENT_PARTICIPANT',
    'info',
    'Jordan Member made you a participant on shipment MSCU1234567.',
    '{"seed": true, "shipment_reference": "MSCU1234567"}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000002',
    null,
    null,
    now() - interval '50 minutes'
  ),
  (
    'c0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'MESSAGE_REPLY',
    'info',
    'Chris Importer replied to your message on MSCU1234567.',
    '{"seed": true}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000005-0000-4000-8000-000000000005',
    null,
    null,
    now() - interval '20 minutes'
  ),
  (
    'c0000001-0000-4000-8000-000000000007',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'MESSAGE_NEW',
    'info',
    'Avery Admin messaged you on shipment MSCU1234567.',
    '{"seed": true}'::jsonb,
    'a0000005-0000-4000-8000-000000000005',
    'a0000004-0000-4000-8000-000000000004',
    null,
    null,
    now() - interval '15 minutes'
  ),
  (
    'c0000001-0000-4000-8000-000000000008',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'DOCUMENT_UPLOADED',
    'info',
    'A document was uploaded to shipment MSCU1234567.',
    '{"seed": true, "document_label": "Commercial invoice"}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000002',
    null,
    null,
    now() - interval '2 hours'
  ),
  (
    'c0000001-0000-4000-8000-000000000009',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'ORG_INVITE_ACCEPTED',
    'info',
    'Jordan Member accepted your invite to join your JBS Foods organization.',
    '{"seed": true}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000002',
    null,
    null,
    now() - interval '1 day'
  ),
  (
    'c0000001-0000-4000-8000-000000000010',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'CUSTOMER_JOINED_ORG',
    'info',
    'Chris Importer joined as a JBS Foods customer.',
    '{"seed": true}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    null,
    null,
    null,
    now() - interval '3 days'
  ),
  (
    'c0000001-0000-4000-8000-000000000011',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'BOL_IMPORTED',
    'info',
    'Bill of lading data was imported for shipment MSCU1234567.',
    '{"seed": true}'::jsonb,
    'a0000002-0000-4000-8000-000000000002',
    'a0000004-0000-4000-8000-000000000004',
    null,
    null,
    now() - interval '6 hours'
  ),
  (
    'c0000001-0000-4000-8000-000000000012',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000011',
    'b0000001-0000-4000-8000-000000000010',
    'TRACKING_SYNC_OK',
    'info',
    'Carrier tracking synced successfully for MSCU1234567.',
    '{"seed": true}'::jsonb,
    null,
    null,
    null,
    null,
    now() - interval '30 minutes'
  );
