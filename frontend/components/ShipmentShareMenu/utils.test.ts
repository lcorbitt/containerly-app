import { describe, expect, it, vi } from "vitest";
import { buildShipmentShareAccessRows, shipmentHubUrl } from "./utils";
import { mockActiveAccess, mockPendingInvite, SHIPMENT_ID } from "./test-utils";

vi.mock("@/services/profile.service", () => ({
  getProfileImagePublicUrlBrowser: (path: string | null) =>
    path ? `https://cdn.example.com/${path}` : null,
}));

describe("buildShipmentShareAccessRows", () => {
  it("returns active rows before pending invites", () => {
    const rows = buildShipmentShareAccessRows({
      profileImagePathByUserId: { "user-abc": "avatars/user-abc.png" },
      activeAccessWithLabels: [{ access: mockActiveAccess(), label: "importer@example.com" }],
      pendingInvites: [mockPendingInvite()],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "access-1",
      kind: "active",
      label: "importer@example.com",
      avatarUrl: "https://cdn.example.com/avatars/user-abc.png",
    });
    expect(rows[0].role).toBeUndefined();
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
