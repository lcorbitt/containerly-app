import { describe, expect, it } from "vitest";
import { isShipmentThreadUnreadForViewer } from "./shipment-thread-unread";

describe("isShipmentThreadUnreadForViewer", () => {
  const viewerUserId = "user-1";
  const lastMessageAt = "2026-06-07T12:00:00.000Z";

  it("returns false when the viewer authored the latest message", () => {
    expect(
      isShipmentThreadUnreadForViewer({
        viewerUserId,
        lastAuthorUserId: viewerUserId,
        lastMessageAt,
        lastReadAt: undefined,
      }),
    ).toBe(false);
  });

  it("returns true when another user authored and nothing was read", () => {
    expect(
      isShipmentThreadUnreadForViewer({
        viewerUserId,
        lastAuthorUserId: "user-2",
        lastMessageAt,
        lastReadAt: undefined,
      }),
    ).toBe(true);
  });

  it("returns false when another user authored but read cursor is current", () => {
    expect(
      isShipmentThreadUnreadForViewer({
        viewerUserId,
        lastAuthorUserId: "user-2",
        lastMessageAt,
        lastReadAt: "2026-06-07T12:00:00.000Z",
      }),
    ).toBe(false);
  });
});
