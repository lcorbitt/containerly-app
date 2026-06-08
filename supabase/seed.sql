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
--   importer@demo.com          — importer customer (no org); grants on MSCU1234567 (tracking + docs)
--                                and JBS-EXP-2026-0142 (documentation-only) → /requests/<id>
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

-- Six demo shipments (same org): US-origin EXPORTS (US port of loading → international destination).
-- Each models a distinct, chronologically-consistent lifecycle stage. Timeline order across
-- shipment_activity_events + tracking_events is:
--   created → drafts attached → approved/rejected(+revision) → originals mailed
--   → carrier tracking # added (WEBHOOK linked) → carrier SYNC updates.
--
-- MSCU1234567 (c…099) — COMPLETE: full lifecycle done, carrier journey delivered (LA → Tokyo). originals_sent. Importer grant f2.
-- MSCU2000002 (c…097) — IN TRANSIT: approved + originals sent, carrier mid-ocean (Houston → Shanghai). originals_sent.
-- MSCU1000001 (c…098) — REJECTION + REVISION: customer rejected a draft w/ reason, operator re-uploaded a revision (Savannah → Rotterdam). rejected.
-- JBS-EXP-2026-0142 (c…096) — DOCS-ONLY EXPORT: drafts awaiting customer review, no containers (Houston → Rotterdam). awaiting_review. Importer grant f3.
-- c…095 — APPROVED, TRACKING REQUESTED BY CUSTOMER: docs approved, no carrier tracking yet, customer asked for a tracking number (Newark → Hamburg). approved.
-- c…094 — JUST CREATED: shipment_created only, no docs, no tracking (Long Beach → Busan). pending_drafts.
insert into public.shipments (
  id,
  organization_id,
  created_by,
  assignee_user_id,
  order_number,
  carrier_booking_number,
  container_number,
  bill_of_lading,
  shipping_line,
  customer_name,
  consignee,
  country,
  port_of_loading,
  port_of_destination,
  estimated_departure_at,
  estimated_arrival_at,
  freight_booking_carrier,
  vessel,
  voyage,
  health_certificate_no,
  trade_terms,
  physical_mail_tracking_number,
  physical_mail_sent_at,
  workflow_status,
  tags
) values
  (
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000002',
    'PO-COSTCO-8891',
    'MEDUSH914201',
    'MSCU1234567',
    'MEDUSH914201',
    'MSC',
    'Costco Wholesale',
    'Kenji Takahashi',
    'JP',
    'Los Angeles, US',
    'Tokyo, JP',
    '2026-05-10 18:00+00',
    '2026-05-27 00:00+00',
    'MSC',
    'MSC LORETO',
    'FY428W',
    'HC-US-2026-8891',
    'CIF',
    'FEDEX 7789 1234 5521',
    now() - interval '35 days',
    'originals_sent',
    array['Costco', 'Priority']::text[]
  ),
  (
    'c0000001-0000-4000-8000-000000000098',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000004',
    'PO-TARGET-1001',
    'BK-MSC-1001',
    'MSCU1000001',
    null,
    'MSC',
    'Target Corp',
    'Sophie van Dijk',
    'NL',
    'Savannah, US',
    'Rotterdam, NL',
    '2026-06-18 08:00+00',
    '2026-07-05 00:00+00',
    'MSC',
    null,
    null,
    null,
    'FOB',
    null,
    null,
    'rejected',
    '{}'::text[]
  ),
  (
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000004',
    'PO-WALMART-2002',
    'BK-MSC-2002',
    'MSCU2000002',
    null,
    'MSC',
    'Walmart',
    'Wei Chen',
    'CN',
    'Houston, US',
    'Shanghai, CN',
    '2026-05-26 14:00+00',
    '2026-06-20 00:00+00',
    'MSC',
    'MSC IRINA',
    'MA412E',
    null,
    'CIF',
    'DHL 4471 9920 0087',
    now() - interval '18 days',
    'originals_sent',
    array['Walmart']::text[]
  ),
  (
    'c0000001-0000-4000-8000-000000000096',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000002',
    'JBS-EXP-2026-0142',
    'BK-JBS-0142',
    'PENDING',
    null,
    null,
    'Costco Wholesale',
    'Lars Jansen',
    'NL',
    'Houston, US',
    'Rotterdam, NL',
    '2026-06-25 08:00+00',
    '2026-07-18 00:00+00',
    'MSC',
    'MSC Sealand',
    'SE601W',
    'HC-US-2026-0142',
    'CIF',
    null,
    null,
    'awaiting_review',
    '{}'::text[]
  ),
  (
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000004',
    'PO-TARGET-3003',
    'BK-MSC-3003',
    'PENDING',
    null,
    'MSC',
    'Target Corp',
    'Anna Müller',
    'DE',
    'Newark, US',
    'Hamburg, DE',
    '2026-06-22 08:00+00',
    '2026-07-09 00:00+00',
    'MSC',
    null,
    null,
    null,
    'CIF',
    null,
    null,
    'approved',
    array['Target']::text[]
  ),
  (
    'c0000001-0000-4000-8000-000000000094',
    'a0000001-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000004',
    'PO-WALMART-4004',
    'BK-MSC-4004',
    'PENDING',
    null,
    'MSC',
    'Walmart',
    'Min-jun Park',
    'KR',
    'Long Beach, US',
    'Busan, KR',
    '2026-07-01 08:00+00',
    '2026-07-20 00:00+00',
    'MSC',
    null,
    null,
    null,
    'FOB',
    null,
    null,
    'pending_drafts',
    '{}'::text[]
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
    "shipped_from": "LOS ANGELES, US",
    "shipped_from_terminal": "APM TERMINALS PIER 400",
    "shipped_to": "TOKYO, JP",
    "shipped_to_terminal": "TOKYO OHI TERMINAL",
    "loading_port": "LOS ANGELES, US",
    "discharging_port": "TOKYO, JP",
    "last_location": "TOKYO, JP",
    "last_location_terminal": "TOKYO OHI TERMINAL",
    "next_location": "TOKYO, JP — CY depot",
    "next_location_terminal": "MOL EMPTY DEPOT — TOKYO",
    "atd_origin": "2026-05-10 18:00",
    "eta_final_destination": "2026-05-27 00:00",
    "atd_last_location": "2026-06-05 08:00",
    "eta_next_destination": "2026-06-05 12:00",
    "customs_clearance": "2026-05-31 16:00",
    "timestamp_of_last_location": "2026-06-07 10:00",
    "last_movement_timestamp": "2026-06-07 10:00",
    "last_updated": "2026-06-07 10:00",
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
      "shipped_from": "LOS ANGELES, US",
      "shipped_from_terminal": "APM TERMINALS PIER 400",
      "shipped_to": "TOKYO, JP",
      "shipped_to_terminal": "TOKYO OHI TERMINAL",
      "atd_origin": "2026-05-10 18:00",
      "eta_final_destination": "2026-05-27 00:00",
      "last_location": "TOKYO, JP",
      "last_location_terminal": "TOKYO OHI TERMINAL",
      "next_location": "TOKYO, JP — CY depot",
      "next_location_terminal": "MOL EMPTY DEPOT — TOKYO",
      "atd_last_location": "2026-06-05 08:00",
      "eta_next_destination": "2026-06-05 12:00",
      "timestamp_of_last_location": "2026-06-07 10:00",
      "last_movement_timestamp": "2026-06-07 10:00",
      "loading_port": "LOS ANGELES, US",
      "discharging_port": "TOKYO, JP",
      "customs_clearance": "2026-05-31 16:00",
      "bill_of_lading": "MEDUSH914201",
      "last_vessel_name": "MSC LORETO",
      "last_voyage_number": "FY428W",
      "current_vessel_name": "MSC LORETO",
      "current_voyage_number": "FY428W",
      "last_updated": "2026-06-07 10:00"
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
    "shipped_from": "SAVANNAH, US",
    "shipped_to": "ROTTERDAM, NL",
    "loading_port": "SAVANNAH, US",
    "discharging_port": "ROTTERDAM, NL",
    "last_location": "SAVANNAH, US",
    "last_location_terminal": "GARDEN CITY TERMINAL",
    "last_updated": "2026-06-06 08:00"
  }$LOC_A$::jsonb,
  $RAW_A${"data": {"container_id": "MSCU1000001", "container_status": "Booking confirmed", "last_updated": "2026-06-06T08:00:00Z"}}$RAW_A$::jsonb,
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
  'In transit — ocean',
  $LOC_B${
    "container_id": "MSCU2000002",
    "container_type": "40' HIGH CUBE REEFER",
    "container_status": "In transit — ocean",
    "shipping_line_name": "Mediterranean Shipping Company",
    "shipped_from": "HOUSTON, US",
    "shipped_to": "SHANGHAI, CN",
    "loading_port": "HOUSTON, US",
    "discharging_port": "SHANGHAI, CN",
    "last_location": "PACIFIC OCEAN",
    "last_location_terminal": null,
    "last_vessel_name": "MSC IRINA",
    "current_vessel_name": "MSC IRINA",
    "last_updated": "2026-06-06 14:00"
  }$LOC_B$::jsonb,
  $RAW_B${"data": {"container_id": "MSCU2000002", "container_status": "In transit — ocean", "last_vessel_name": "MSC IRINA", "last_updated": "2026-06-06T14:00:00Z"}}$RAW_B$::jsonb,
  now(),
  now()
);

-- Order/booking lines (commercial model); container_id set when carrier tracking exists.
insert into public.shipment_lines (
  id,
  shipment_id,
  organization_id,
  container_id,
  container_number,
  order_number,
  customer_name,
  consignee,
  country,
  port_of_loading,
  port_of_destination,
  freight_booking_carrier,
  vessel,
  voyage,
  health_certificate_no,
  trade_terms,
  sort_order
) values
  (
    'd0000001-0000-4000-8000-000000000099',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000010',
    'MSCU1234567',
    'PO-88421',
    'Costco Wholesale',
    'Kenji Takahashi',
    'JP',
    'Los Angeles, US',
    'Tokyo, JP',
    'MSC',
    'MSC LORETO',
    'FY428W',
    'HC-US-2026-8891',
    'CIF',
    0
  ),
  (
    'd0000001-0000-4000-8000-000000000098',
    'c0000001-0000-4000-8000-000000000098',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000012',
    'MSCU1000001',
    'PO-99102',
    'Target Corp',
    'Sophie van Dijk',
    'NL',
    'Savannah, US',
    'Rotterdam, NL',
    'MSC',
    null,
    null,
    null,
    'FOB',
    0
  ),
  (
    'd0000001-0000-4000-8000-000000000097',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000014',
    'MSCU2000002',
    'PO-77201',
    'Walmart',
    'Wei Chen',
    'CN',
    'Houston, US',
    'Shanghai, CN',
    'MSC',
    'MSC IRINA',
    'MA412E',
    null,
    'CIF',
    0
  ),
  (
    'd0000001-0000-4000-8000-000000000091',
    'c0000001-0000-4000-8000-000000000096',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'PO-44201-A',
    'Costco Wholesale',
    'Lars Jansen',
    'NL',
    'Houston, US',
    'Rotterdam, NL',
    'MSC',
    'MSC Sealand',
    'SE601W',
    'HC-US-2026-0142',
    'CIF',
    0
  ),
  (
    'd0000001-0000-4000-8000-000000000092',
    'c0000001-0000-4000-8000-000000000096',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'PO-44201-B',
    'Costco Wholesale',
    'Lars Jansen',
    'NL',
    'Houston, US',
    'Rotterdam, NL',
    'MSC',
    'MSC Sealand',
    'SE601W',
    'HC-US-2026-0142',
    'CIF',
    1
  ),
  (
    'd0000001-0000-4000-8000-000000000095',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'PO-30031',
    'Target Corp',
    'Anna Müller',
    'DE',
    'Newark, US',
    'Hamburg, DE',
    'MSC',
    null,
    null,
    null,
    'CIF',
    0
  ),
  (
    'd0000001-0000-4000-8000-000000000094',
    'c0000001-0000-4000-8000-000000000094',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'PO-40041',
    'Walmart',
    'Min-jun Park',
    'KR',
    'Long Beach, US',
    'Busan, KR',
    'MSC',
    null,
    null,
    null,
    'FOB',
    0
  );

update public.containers
set enrichment = jsonb_build_object(
  'source_last_fetched_at', now(),
  'vessel_ais', jsonb_build_object(
    'name', 'MSC LORETO',
    'lat', 35.45,
    'lon', 139.78,
    'speed', 0.2,
    'last_position_UTC', '2026-06-07T10:00:00Z',
    'eta_UTC', '2026-05-27T00:00:00Z'
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
  ('c0000001-0000-4000-8000-000000000097', 'a0000002-0000-4000-8000-000000000002'),
  ('c0000001-0000-4000-8000-000000000095', 'a0000002-0000-4000-8000-000000000002'),
  ('c0000001-0000-4000-8000-000000000094', 'a0000002-0000-4000-8000-000000000002');

-- Full export journey (Los Angeles → Tokyo): carrier tracking # added (WEBHOOK linked) AFTER originals were
-- mailed, then SYNC milestones to delivery. Final carrier-facing status matches containers.status.
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
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '34 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Booking confirmed',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '33 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Packed — cartons sealed at shipper warehouse',
    '{"last_location": "VERNON, CA", "last_location_terminal": "JBS FOODS — EXPORT CFS"}'::jsonb,
    now() - interval '32 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Gate in full at export terminal',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '31 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Loaded on vessel',
    '{"last_location": "LOS ANGELES, US", "last_location_terminal": "APM TERMINALS PIER 400"}'::jsonb,
    now() - interval '30 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Vessel departed origin',
    '{"last_location": "LOS ANGELES, US"}'::jsonb,
    now() - interval '29 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'In transit — Pacific',
    '{"last_location": "PACIFIC OCEAN"}'::jsonb,
    now() - interval '27 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Discharged at transshipment hub',
    '{"last_location": "BUSAN, KR", "last_location_terminal": "HMM PUSAN NEW PORT"}'::jsonb,
    now() - interval '22 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Reloaded on mainline vessel',
    '{"last_location": "BUSAN, KR", "last_location_terminal": "HMM PUSAN NEW PORT"}'::jsonb,
    now() - interval '21 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'In transit — East China Sea',
    '{"last_location": "EAST CHINA SEA"}'::jsonb,
    now() - interval '19 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Vessel arrived POD',
    '{"last_location": "TOKYO, JP"}'::jsonb,
    now() - interval '12 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Berthed alongside',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "TOKYO OHI TERMINAL"}'::jsonb,
    now() - interval '11 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Discharged from vessel',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "TOKYO OHI TERMINAL"}'::jsonb,
    now() - interval '10 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Customs import clearance released',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "TOKYO CUSTOMS"}'::jsonb,
    now() - interval '8 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Available for pickup',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "OHI OFF-DOCK CFS"}'::jsonb,
    now() - interval '6 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Truck dispatched for delivery',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "OHI TERMINAL OUTGATE"}'::jsonb,
    now() - interval '4 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Delivered to consignee door',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "COSTCO JAPAN — DC"}'::jsonb,
    now() - interval '3 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Empty returned to depot',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "MOL EMPTY DEPOT — TOKYO"}'::jsonb,
    now() - interval '2 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'b0000001-0000-4000-8000-000000000011',
    'SYNC',
    'Shipment complete',
    '{"last_location": "TOKYO, JP", "last_location_terminal": "TOKYO OHI TERMINAL"}'::jsonb,
    now() - interval '24 hours',
    '{}'::jsonb
  );

-- Rejection scenario (Savannah → Rotterdam): carrier tracking added recently — just linked + booking confirmed.
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
    'b0000001-0000-4000-8000-000000000012',
    'b0000001-0000-4000-8000-000000000013',
    'WEBHOOK',
    'Webhook — carrier data linked',
    '{"last_location": "SAVANNAH, US", "last_location_terminal": "GARDEN CITY TERMINAL"}'::jsonb,
    now() - interval '3 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000012',
    'b0000001-0000-4000-8000-000000000013',
    'SYNC',
    'Booking confirmed',
    '{"last_location": "SAVANNAH, US", "last_location_terminal": "GARDEN CITY TERMINAL"}'::jsonb,
    now() - interval '2 days',
    '{}'::jsonb
  );

-- In transit (Houston → Shanghai): approved + originals sent, carrier tracking linked, now mid-Pacific.
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
    '{"last_location": "HOUSTON, US", "last_location_terminal": "BAYPORT CONTAINER TERMINAL"}'::jsonb,
    now() - interval '17 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Booking confirmed',
    '{"last_location": "HOUSTON, US", "last_location_terminal": "BAYPORT CONTAINER TERMINAL"}'::jsonb,
    now() - interval '16 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Packed — cartons sealed at shipper warehouse',
    '{"last_location": "GREELEY, CO", "last_location_terminal": "JBS FOODS — EXPORT CFS"}'::jsonb,
    now() - interval '15 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Gate in full at export terminal',
    '{"last_location": "HOUSTON, US", "last_location_terminal": "BAYPORT CONTAINER TERMINAL"}'::jsonb,
    now() - interval '14 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Loaded on vessel',
    '{"last_location": "HOUSTON, US", "last_location_terminal": "BAYPORT CONTAINER TERMINAL"}'::jsonb,
    now() - interval '13 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Vessel departed origin',
    '{"last_location": "HOUSTON, US"}'::jsonb,
    now() - interval '12 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'Transited Panama Canal',
    '{"last_location": "PANAMA CANAL"}'::jsonb,
    now() - interval '8 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'In transit — Pacific',
    '{"last_location": "PACIFIC OCEAN"}'::jsonb,
    now() - interval '5 days',
    '{}'::jsonb
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'b0000001-0000-4000-8000-000000000015',
    'SYNC',
    'In transit — ocean',
    '{"last_location": "PACIFIC OCEAN"}'::jsonb,
    now() - interval '2 days',
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
  'b0000001-0000-4000-8000-0000000000f3',
  'a0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000096',
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

-- Customer-facing documents (metadata only; storage paths are demo placeholders).
-- Per scenario: c…099 + c…097 fully approved (drafts) with originals on file; c…098 rejected draft + pending
-- revision; c…096 drafts awaiting review; c…095 approved drafts; c…094 has no documents yet.
insert into public.workspace_attachments (
  id,
  organization_id,
  shipment_id,
  is_internal,
  storage_path,
  file_name,
  content_type,
  file_size_bytes,
  uploaded_by,
  uploaded_by_kind,
  document_type,
  document_group,
  approval_status,
  rejection_reason,
  reviewed_at,
  reviewed_by_user_id,
  shipment_line_id
) values
  -- c…099 (MSCU1234567): drafts approved by customer, physical originals on file.
  (
    'e0000001-0000-4000-8000-000000000001',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000099',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000099/commercial-invoice.pdf',
    'Commercial Invoice — MSCU1234567.pdf',
    'application/pdf',
    245760,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'draft',
    'approved',
    null,
    now() - interval '37 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000099'
  ),
  (
    'e0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000099',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000099/packing-list.pdf',
    'Packing List — MSCU1234567.pdf',
    'application/pdf',
    98304,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Packing List',
    'draft',
    'approved',
    null,
    now() - interval '37 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000099'
  ),
  (
    'e0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000099',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000099/commercial-invoice-original.pdf',
    'Commercial Invoice (Original) — MSCU1234567.pdf',
    'application/pdf',
    251904,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'original',
    'pending',
    null,
    null,
    null,
    'd0000001-0000-4000-8000-000000000099'
  ),
  (
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000099',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000099/packing-list-original.pdf',
    'Packing List (Original) — MSCU1234567.pdf',
    'application/pdf',
    101376,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Packing List',
    'original',
    'pending',
    null,
    null,
    null,
    'd0000001-0000-4000-8000-000000000099'
  ),
  -- c…097 (MSCU2000002): drafts approved, original commercial invoice mailed.
  (
    'e0000001-0000-4000-8000-000000000007',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000097',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000097/commercial-invoice.pdf',
    'Commercial Invoice — MSCU2000002.pdf',
    'application/pdf',
    238592,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'draft',
    'approved',
    null,
    now() - interval '19 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000097'
  ),
  (
    'e0000001-0000-4000-8000-000000000008',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000097',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000097/packing-list.pdf',
    'Packing List — MSCU2000002.pdf',
    'application/pdf',
    91136,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Packing List',
    'draft',
    'approved',
    null,
    now() - interval '19 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000097'
  ),
  (
    'e0000001-0000-4000-8000-000000000009',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000097',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000097/commercial-invoice-original.pdf',
    'Commercial Invoice (Original) — MSCU2000002.pdf',
    'application/pdf',
    244736,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'original',
    'pending',
    null,
    null,
    null,
    'd0000001-0000-4000-8000-000000000097'
  ),
  -- c…098 (MSCU1000001): customer rejected the draft commercial invoice; operator re-uploaded a revision.
  (
    'e0000001-0000-4000-8000-000000000010',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000098',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000098/commercial-invoice.pdf',
    'Commercial Invoice — MSCU1000001.pdf',
    'application/pdf',
    229376,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'draft',
    'rejected',
    'Incoterm shows FOB but the PO requires CIF, and the consignee address is missing the postal code. Please correct and re-issue.',
    now() - interval '5 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000098'
  ),
  (
    'e0000001-0000-4000-8000-000000000011',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000098',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000098/commercial-invoice-rev2.pdf',
    'Commercial Invoice (Rev 2) — MSCU1000001.pdf',
    'application/pdf',
    231424,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'revision',
    'pending',
    null,
    null,
    null,
    'd0000001-0000-4000-8000-000000000098'
  ),
  -- c…096 (JBS-EXP-2026-0142): documentation-only export, drafts awaiting customer review.
  (
    'e0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000096',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000096/commercial-invoice.pdf',
    'Commercial Invoice — JBS-EXP-2026-0142.pdf',
    'application/pdf',
    312000,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'draft',
    'pending',
    null,
    null,
    null,
    'd0000001-0000-4000-8000-000000000091'
  ),
  (
    'e0000001-0000-4000-8000-000000000004',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000096',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000096/health-certificate.pdf',
    'Health Certificate — HC-US-2026-0142.pdf',
    'application/pdf',
    156000,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Health Certificate',
    'draft',
    'pending',
    null,
    null,
    null,
    'd0000001-0000-4000-8000-000000000091'
  ),
  -- c…095 (Target / Hamburg): drafts approved; awaiting originals + carrier tracking number.
  (
    'e0000001-0000-4000-8000-000000000012',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000095',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000095/commercial-invoice.pdf',
    'Commercial Invoice — PO-TARGET-3003.pdf',
    'application/pdf',
    221184,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Commercial Invoice',
    'draft',
    'approved',
    null,
    now() - interval '3 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000095'
  ),
  (
    'e0000001-0000-4000-8000-000000000013',
    'a0000001-0000-4000-8000-000000000001',
    'c0000001-0000-4000-8000-000000000095',
    false,
    'a0000001-0000-4000-8000-000000000001/shipments/c0000001-0000-4000-8000-000000000095/packing-list.pdf',
    'Packing List — PO-TARGET-3003.pdf',
    'application/pdf',
    87040,
    'a0000004-0000-4000-8000-000000000004',
    'operator',
    'Packing List',
    'draft',
    'approved',
    null,
    now() - interval '3 days',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000095'
  );

-- Business timeline (merged with carrier tracking_events in the UI, sorted by occurred_at).
-- Each shipment's events follow: created → drafts → approve/reject(+revision) → originals → (carrier link).
insert into public.shipment_activity_events (
  id,
  shipment_id,
  organization_id,
  event_type,
  body,
  actor_kind,
  actor_user_id,
  metadata,
  occurred_at
) values
  -- ── c…099 (MSCU1234567): complete happy path ──────────────────────────────
  (
    'f0000001-0000-4000-8000-0000000000a1',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'shipment_created',
    'Shipment created',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"order_number":"PO-COSTCO-8891","customer_name":"Costco Wholesale","container_number":"MSCU1234567","carrier_booking_number":"MEDUSH914201","port_of_loading":"Los Angeles, US","port_of_destination":"Tokyo, JP","line_count":1}'::jsonb,
    now() - interval '40 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000a2',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'drafts_attached',
    'Draft export documents uploaded for customer review.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"file_count":2,"documents":[{"attachment_id":"e0000001-0000-4000-8000-000000000001","file_name":"Commercial Invoice — MSCU1234567.pdf","document_type":"Commercial Invoice","document_group":"draft"},{"attachment_id":"e0000001-0000-4000-8000-000000000002","file_name":"Packing List — MSCU1234567.pdf","document_type":"Packing List","document_group":"draft"}]}'::jsonb,
    now() - interval '39 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000a3',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Commercial Invoice approved.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"attachment_id":"e0000001-0000-4000-8000-000000000001","file_name":"Commercial Invoice — MSCU1234567.pdf","document_type":"Commercial Invoice","document_group":"draft","approval_status":"approved"}'::jsonb,
    now() - interval '37 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000a4',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Packing List approved.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"attachment_id":"e0000001-0000-4000-8000-000000000002","file_name":"Packing List — MSCU1234567.pdf","document_type":"Packing List","document_group":"draft","approval_status":"approved"}'::jsonb,
    now() - interval '36 days 22 hours'
  ),
  (
    'f0000001-0000-4000-8000-0000000000a5',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Draft documents are approved — please send to the mailing address on file.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"file_count":2}'::jsonb,
    now() - interval '36 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000a6',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'originals_mailed',
    'Original documents have been mailed.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"document_group":"original"}'::jsonb,
    now() - interval '35 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000a7',
    'c0000001-0000-4000-8000-000000000099',
    'a0000001-0000-4000-8000-000000000001',
    'originals_mailed',
    'Tracking number added: FEDEX 7789 1234 5521',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"document_group":"original","tracking_number":"FEDEX 7789 1234 5521"}'::jsonb,
    now() - interval '34 days 23 hours'
  ),
  -- ── c…097 (MSCU2000002): approved + originals sent, now in transit ─────────
  (
    'f0000001-0000-4000-8000-0000000000b1',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'shipment_created',
    'Shipment created',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"order_number":"PO-WALMART-2002","customer_name":"Walmart","container_number":"MSCU2000002","carrier_booking_number":"BK-MSC-2002","port_of_loading":"Houston, US","port_of_destination":"Shanghai, CN","line_count":1}'::jsonb,
    now() - interval '22 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000b2',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'drafts_attached',
    'Draft export documents uploaded for customer review.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"file_count":2,"documents":[{"attachment_id":"e0000001-0000-4000-8000-000000000007","file_name":"Commercial Invoice — MSCU2000002.pdf","document_type":"Commercial Invoice","document_group":"draft"},{"attachment_id":"e0000001-0000-4000-8000-000000000008","file_name":"Packing List — MSCU2000002.pdf","document_type":"Packing List","document_group":"draft"}]}'::jsonb,
    now() - interval '21 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000b3',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Draft documents are approved — please send to the mailing address on file.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"file_count":2}'::jsonb,
    now() - interval '19 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000b4',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'originals_mailed',
    'Original documents have been mailed.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"document_group":"original"}'::jsonb,
    now() - interval '18 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000b5',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'originals_mailed',
    'Tracking number added: DHL 4471 9920 0087',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"document_group":"original","tracking_number":"DHL 4471 9920 0087"}'::jsonb,
    now() - interval '17 days 22 hours'
  ),
  (
    'f0000001-0000-4000-8000-0000000000b6',
    'c0000001-0000-4000-8000-000000000097',
    'a0000001-0000-4000-8000-000000000001',
    'risk_status_updated',
    'Risk status set to Medium.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"risk_level":"medium","previous_risk_level":"low","risk_message":"Schedule reliability on this lane is trending down; monitoring the berth window at Shanghai."}'::jsonb,
    now() - interval '7 days'
  ),
  -- ── c…098 (MSCU1000001): rejection + revision loop ─────────────────────────
  (
    'f0000001-0000-4000-8000-0000000000c1',
    'c0000001-0000-4000-8000-000000000098',
    'a0000001-0000-4000-8000-000000000001',
    'shipment_created',
    'Shipment created',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"order_number":"PO-TARGET-1001","customer_name":"Target Corp","container_number":"MSCU1000001","carrier_booking_number":"BK-MSC-1001","port_of_loading":"Savannah, US","port_of_destination":"Rotterdam, NL","line_count":1}'::jsonb,
    now() - interval '8 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000c2',
    'c0000001-0000-4000-8000-000000000098',
    'a0000001-0000-4000-8000-000000000001',
    'drafts_attached',
    'Draft commercial invoice uploaded for customer review.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"file_count":1,"documents":[{"attachment_id":"e0000001-0000-4000-8000-000000000010","file_name":"Commercial Invoice — MSCU1000001.pdf","document_type":"Commercial Invoice","document_group":"draft"}]}'::jsonb,
    now() - interval '7 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000c3',
    'c0000001-0000-4000-8000-000000000098',
    'a0000001-0000-4000-8000-000000000001',
    'documents_rejected',
    'Commercial Invoice rejected — Incoterm shows FOB but the PO requires CIF, and the consignee address is missing the postal code. Please correct and re-issue.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"attachment_id":"e0000001-0000-4000-8000-000000000010","file_name":"Commercial Invoice — MSCU1000001.pdf","document_type":"Commercial Invoice","document_group":"draft","approval_status":"rejected","rejection_reason":"Incoterm shows FOB but the PO requires CIF, and the consignee address is missing the postal code. Please correct and re-issue."}'::jsonb,
    now() - interval '5 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000c4',
    'c0000001-0000-4000-8000-000000000098',
    'a0000001-0000-4000-8000-000000000001',
    'drafts_attached',
    'Revised commercial invoice uploaded for customer review.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"file_count":1,"documents":[{"attachment_id":"e0000001-0000-4000-8000-000000000011","file_name":"Commercial Invoice (Rev 2) — MSCU1000001.pdf","document_type":"Commercial Invoice","document_group":"revision"}]}'::jsonb,
    now() - interval '4 days'
  ),
  -- ── c…096 (JBS-EXP-2026-0142): documentation-only export, awaiting review ──
  (
    'f0000001-0000-4000-8000-0000000000d1',
    'c0000001-0000-4000-8000-000000000096',
    'a0000001-0000-4000-8000-000000000001',
    'shipment_created',
    'Shipment created',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"order_number":"JBS-EXP-2026-0142","customer_name":"Costco Wholesale","container_number":"PENDING","carrier_booking_number":"BK-JBS-0142","port_of_loading":"Houston, US","port_of_destination":"Rotterdam, NL","line_count":2}'::jsonb,
    now() - interval '3 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000d2',
    'c0000001-0000-4000-8000-000000000096',
    'a0000001-0000-4000-8000-000000000001',
    'drafts_attached',
    'Draft commercial invoice and health certificate sent for Costco review.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"file_count":2,"documents":[{"attachment_id":"e0000001-0000-4000-8000-000000000003","file_name":"Commercial Invoice — JBS-EXP-2026-0142.pdf","document_type":"Commercial Invoice","document_group":"draft"},{"attachment_id":"e0000001-0000-4000-8000-000000000004","file_name":"Health Certificate — HC-US-2026-0142.pdf","document_type":"Health Certificate","document_group":"draft"}]}'::jsonb,
    now() - interval '2 days'
  ),
  -- ── c…095 (Target / Hamburg): approved, customer asked for a tracking number ──
  (
    'f0000001-0000-4000-8000-0000000000e1',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'shipment_created',
    'Shipment created',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"order_number":"PO-TARGET-3003","customer_name":"Target Corp","container_number":"PENDING","carrier_booking_number":"BK-MSC-3003","port_of_loading":"Newark, US","port_of_destination":"Hamburg, DE","line_count":1}'::jsonb,
    now() - interval '6 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000e2',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'drafts_attached',
    'Draft export documents uploaded for customer review.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"file_count":2,"documents":[{"attachment_id":"e0000001-0000-4000-8000-000000000012","file_name":"Commercial Invoice — PO-TARGET-3003.pdf","document_type":"Commercial Invoice","document_group":"draft"},{"attachment_id":"e0000001-0000-4000-8000-000000000013","file_name":"Packing List — PO-TARGET-3003.pdf","document_type":"Packing List","document_group":"draft"}]}'::jsonb,
    now() - interval '5 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000e3',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Commercial Invoice approved.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"attachment_id":"e0000001-0000-4000-8000-000000000012","file_name":"Commercial Invoice — PO-TARGET-3003.pdf","document_type":"Commercial Invoice","document_group":"draft","approval_status":"approved"}'::jsonb,
    now() - interval '3 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000e4',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Packing List approved.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"attachment_id":"e0000001-0000-4000-8000-000000000013","file_name":"Packing List — PO-TARGET-3003.pdf","document_type":"Packing List","document_group":"draft","approval_status":"approved"}'::jsonb,
    now() - interval '2 days 22 hours'
  ),
  (
    'f0000001-0000-4000-8000-0000000000e5',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'documents_approved',
    'Draft documents are approved — please send to the mailing address on file.',
    'customer',
    'a0000005-0000-4000-8000-000000000005',
    '{"file_count":2}'::jsonb,
    now() - interval '2 days 21 hours'
  ),
  (
    'f0000001-0000-4000-8000-0000000000e6',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'customer_message',
    'Could you share the container tracking number once the booking is confirmed? We need it for our inbound scheduling.',
    'customer',
    null,
    '{"author_display_name":"Mia (Target)","message_preview":"Could you share the container tracking number once the booking is confirmed? We need it for our inbound scheduling."}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'f0000001-0000-4000-8000-0000000000e7',
    'c0000001-0000-4000-8000-000000000095',
    'a0000001-0000-4000-8000-000000000001',
    'operator_message',
    'Booking is confirmed — I will share the MSC container number as soon as carrier tracking is linked.',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"author_display_name":"Avery Admin","message_preview":"Booking is confirmed — I will share the MSC container number as soon as carrier tracking is linked."}'::jsonb,
    now() - interval '1 day 20 hours'
  ),
  -- ── c…094 (Walmart / Busan): just created ─────────────────────────────────
  (
    'f0000001-0000-4000-8000-0000000000f1',
    'c0000001-0000-4000-8000-000000000094',
    'a0000001-0000-4000-8000-000000000001',
    'shipment_created',
    'Shipment created',
    'operator',
    'a0000004-0000-4000-8000-000000000004',
    '{"order_number":"PO-WALMART-4004","customer_name":"Walmart","container_number":"PENDING","carrier_booking_number":"BK-MSC-4004","port_of_loading":"Long Beach, US","port_of_destination":"Busan, KR","line_count":1}'::jsonb,
    now() - interval '20 hours'
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
-- ASSIGNMENT_PARTICIPANT, MESSAGE_NEW, MESSAGE_REPLY, DOCUMENT_UPLOADED, DOCUMENT_REJECTED,
-- DOCUMENTS_APPROVED, DOCUMENTS_MAILED, CUSTOMER_INVITE_SENT, ORG_INVITE_ACCEPTED,
-- CUSTOMER_JOINED_ORG, BOL_IMPORTED, TRACKING_SYNC_OK (+ add more in application code as needed).
insert into public.alerts (
  id,
  organization_id,
  tracking_request_id,
  container_id,
  shipment_id,
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
    'ASSIGNMENT_ASSIGNEE',
    'info',
    'Avery Admin made you the assignee of shipment MSCU1234567.',
    '{"seed": true, "order_number": "PO-COSTCO-8891"}'::jsonb,
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
    'c0000001-0000-4000-8000-000000000099',
    'ASSIGNMENT_PARTICIPANT',
    'info',
    'Jordan Member made you a participant on shipment MSCU1234567.',
    '{"seed": true, "order_number": "PO-COSTCO-8891"}'::jsonb,
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
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
    'c0000001-0000-4000-8000-000000000099',
    'TRACKING_SYNC_OK',
    'info',
    'Carrier tracking synced successfully for MSCU1234567.',
    '{"seed": true}'::jsonb,
    null,
    null,
    null,
    null,
    now() - interval '30 minutes'
  ),
  (
    'c0000001-0000-4000-8000-000000000013',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'c0000001-0000-4000-8000-000000000096',
    'DOCUMENT_UPLOADED',
    'info',
    'Draft documents uploaded for JBS-EXP-2026-0142 — awaiting customer review.',
    '{"seed": true, "document_label": "Commercial Invoice"}'::jsonb,
    'a0000002-0000-4000-8000-000000000002',
    'a0000004-0000-4000-8000-000000000004',
    null,
    null,
    now() - interval '2 hours'
  ),
  (
    'c0000001-0000-4000-8000-000000000014',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'c0000001-0000-4000-8000-000000000099',
    'DOCUMENTS_APPROVED',
    'info',
    'Chris Importer approved export documents for MSCU1234567 (demo — already acknowledged).',
    '{"seed": true}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000005-0000-4000-8000-000000000005',
    now() - interval '1 day',
    'a0000004-0000-4000-8000-000000000004',
    now() - interval '2 days'
  ),
  (
    'c0000001-0000-4000-8000-000000000015',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'c0000001-0000-4000-8000-000000000096',
    'CUSTOMER_INVITE_SENT',
    'info',
    'Portal invite sent to importer@demo.com for JBS-EXP-2026-0142.',
    '{"seed": true, "delivery_mode": "email_invite"}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000004',
    null,
    null,
    now() - interval '3 hours'
  ),
  (
    'c0000001-0000-4000-8000-000000000016',
    'a0000001-0000-4000-8000-000000000001',
    'b0000001-0000-4000-8000-000000000013',
    'b0000001-0000-4000-8000-000000000012',
    'c0000001-0000-4000-8000-000000000098',
    'DOCUMENT_REJECTED',
    'warning',
    'MSCU1000001: customer rejected the draft commercial invoice — revision requested.',
    '{"seed": true, "order_number": "PO-TARGET-1001"}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000005-0000-4000-8000-000000000005',
    null,
    null,
    now() - interval '5 days'
  ),
  (
    'c0000001-0000-4000-8000-000000000017',
    'a0000001-0000-4000-8000-000000000001',
    null,
    null,
    'c0000001-0000-4000-8000-000000000095',
    'DOCUMENTS_APPROVED',
    'info',
    'Export documents approved for PO-TARGET-3003 — ready to send originals.',
    '{"seed": true, "order_number": "PO-TARGET-3003"}'::jsonb,
    'a0000004-0000-4000-8000-000000000004',
    'a0000005-0000-4000-8000-000000000005',
    null,
    null,
    now() - interval '2 days 21 hours'
  );
