import { vi } from "vitest";
import type { ShipmentCustomerAccess, CustomerInvite } from "@/types/database";
import { buildShipmentShareAccessRows, shipmentHubUrl } from "./utils";

vi.mock("@/services/profile.service", () => ({
  getProfileImagePublicUrlBrowser: (path: string | null) =>
    path ? `https://cdn.example.com/${path}` : null,
}));

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const SHIPMENT_ID = "22222222-2222-4222-8222-222222222222";

function activeAccess(overrides: Partial<ShipmentCustomerAccess> = {}): ShipmentCustomerAccess {
  return {
    id: "access-1",
    shipment_id: SHIPMENT_ID,
    organization_id: ORG_ID,
    customer_user_id: "user-abc",
    invite_id: null,
    visibility_settings: {},
    operator_overrides: {},
    configuration_reminder_due_at: null,
    profile_completed_at: null,
    revoked_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function pendingInvite(overrides: Partial<CustomerInvite> = {}): CustomerInvite {
  return {
    id: "invite-1",
    organization_id: ORG_ID,
    shipment_id: SHIPMENT_ID,
    invited_email: "pending@example.com",
    invited_by_user_id: "operator-1",
    token_hash: "hash",
    status: "pending",
    expires_at: "2026-12-31T00:00:00Z",
    visibility_settings: {},
    delivery_mode: "email_invite",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildShipmentShareAccessRows", () => {
  it("returns active rows before pending invites", () => {
    const rows = buildShipmentShareAccessRows({
      profileImagePathByUserId: { "user-abc": "avatars/user-abc.png" },
      activeAccessWithLabels: [{ access: activeAccess(), label: "importer@example.com" }],
      pendingInvites: [pendingInvite()],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "access-1",
      kind: "active",
      label: "importer@example.com",
      role: "Importer",
      avatarUrl: "https://cdn.example.com/avatars/user-abc.png",
    });
    expect(rows[1]).toMatchObject({
      id: "invite-1",
      kind: "pending",
      label: "pending@example.com",
      sublabel: "Invite pending",
      role: "Pending",
      avatarUrl: null,
    });
  });

  it("returns empty array when there is no access", () => {
    expect(
      buildShipmentShareAccessRows({
        profileImagePathByUserId: {},
        activeAccessWithLabels: [],
        pendingInvites: [],
      }),
    ).toEqual([]);
  });
});

describe("shipmentHubUrl", () => {
  it("prefixes origin when provided", () => {
    expect(shipmentHubUrl(SHIPMENT_ID, "https://app.example.com")).toBe(
      `https://app.example.com/shipments/hub/${SHIPMENT_ID}`,
    );
  });

  it("returns path only when origin is empty", () => {
    expect(shipmentHubUrl(SHIPMENT_ID, "")).toBe(`/shipments/hub/${SHIPMENT_ID}`);
  });
});
