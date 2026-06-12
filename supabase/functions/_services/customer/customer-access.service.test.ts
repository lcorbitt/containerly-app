import { assertEquals, assertExists } from "@std/assert";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  createCustomerInvite,
  CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR,
} from "./customer-access.service.ts";
import { inviteTestState, resetInviteTestState } from "../testing/invite-test-state.ts";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const SHIPMENT_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const fakeClient = {} as SupabaseClient;

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    organization_id: ORG_ID,
    shipment_id: SHIPMENT_ID,
    invited_email: "importer@example.com",
    ...overrides,
  };
}

Deno.test.beforeEach(() => {
  resetInviteTestState();
  inviteTestState.shipmentOrganizationId = ORG_ID;
});

Deno.test("createCustomerInvite rejects invalid organization_id", async () => {
  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput({
    organization_id: "not-a-uuid",
  }));

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.status, 400);
    assertEquals(result.error, "Invalid organization_id");
  }
});

Deno.test("createCustomerInvite rejects invalid shipment_id", async () => {
  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput({
    shipment_id: "bad",
  }));

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.status, 400);
    assertEquals(result.error, "Invalid shipment_id");
  }
});

Deno.test("createCustomerInvite rejects missing invited_email", async () => {
  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput({
    invited_email: "not-an-email",
  }));

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.status, 400);
    assertEquals(result.error, "Valid invited_email required");
  }
});

Deno.test("createCustomerInvite blocks operator email", async () => {
  inviteTestState.blockOperatorEmail = true;

  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput({
    invited_email: "operator@example.com",
  }));

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.status, 400);
    assertEquals(result.error, CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR);
  }
});

Deno.test("createCustomerInvite rejects shipment org mismatch", async () => {
  inviteTestState.shipmentOrganizationId = "99999999-9999-4999-8999-999999999999";

  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput());

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.status, 400);
    assertEquals(result.error, "Shipment does not belong to organization");
  }
});

Deno.test("createCustomerInvite inserts a new pending invite", async () => {
  Deno.env.set("PUBLIC_SITE_URL", "https://app.example.com");

  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput({
    delivery_mode: "email_invite",
  }));

  assertEquals(inviteTestState.inserted, true);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.invite_url);
    assertEquals(result.invite_url.includes("/invite/accept?token="), true);
    assertEquals(result.invite_url.startsWith("https://app.example.com"), true);
  }
});

Deno.test("createCustomerInvite refreshes an existing pending invite", async () => {
  inviteTestState.existingPendingInviteId = "invite-existing";

  const result = await createCustomerInvite(fakeClient, fakeClient, USER_ID, baseInput({
    delivery_mode: "allowlist_only",
  }));

  assertEquals(inviteTestState.updated, true);
  assertEquals(inviteTestState.inserted, false);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.invite_url.includes("/invite/accept?token="), true);
  }
});
