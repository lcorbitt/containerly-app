import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import type { ShipmentAccessTabSnapshot } from "@/services/shipment.service";
import { ORG_ID } from "@/components/ShipmentShareMenu/test-utils";

export const SHIPMENT_ID = "22222222-2222-4222-8222-222222222222";
export const ACCESS_REQUEST_ID = "33333333-3333-4333-8333-333333333333";

const SUPABASE_BASE = "https://test.supabase.co";

export const emptySnapshot: ShipmentAccessTabSnapshot = {
  assigneeUserId: null,
  participantRows: [],
  orgPeers: [],
  profileImagePathByUserId: {},
  customerAccessRows: [],
  pendingInvites: [],
  pendingAccessRequests: [],
  messageAuthorByUserId: {},
  customerEmailByUserId: {},
  tags: [],
  orgTagSuggestions: [],
  emailNotificationsSubscribed: false,
};

export function accessTabHandler(snapshot: ShipmentAccessTabSnapshot = emptySnapshot) {
  return http.get(
    `*/api/organizations/${ORG_ID}/shipments/${SHIPMENT_ID}/access-tab`,
    () => HttpResponse.json({ snapshot }),
  );
}

export function createInviteHandler(
  impl: (body: Record<string, unknown>) => HttpResponse<Record<string, unknown>>,
) {
  return http.post(`${SUPABASE_BASE}/functions/v1/${EDGE_FUNCTION_SLUGS.customers.createInvite}`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return impl(body);
  });
}

export function resolveAccessRequestHandler(
  impl: (body: Record<string, unknown>) => HttpResponse<Record<string, unknown>>,
) {
  return http.post(
    `${SUPABASE_BASE}/functions/v1/${EDGE_FUNCTION_SLUGS.customers.resolveAccessRequest}`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return impl(body);
    },
  );
}

export function createShareMswServer(...handlers: Parameters<typeof setupServer>[0]) {
  return setupServer(...handlers);
}
