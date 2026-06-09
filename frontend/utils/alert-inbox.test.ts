import { describe, expect, it } from "vitest";
import { filterBellNotifications, filterBellNotificationAlerts, filterInboxAlertsForViewer } from "./alert-inbox";
import type { Alert } from "@/types/database";

function sampleAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "alert-1",
    organization_id: "org-1",
    shipment_id: "ship-1",
    container_id: null,
    tracking_request_id: null,
    report_message_id: null,
    inbox_kind: "notification",
    alert_type: "DOCUMENT_UPLOADED",
    severity: "info",
    message: "Document uploaded",
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: "2026-06-07T12:00:00.000Z",
    recipient_user_id: null,
    actor_user_id: "user-1",
    details: null,
    ...overrides,
  };
}

describe("filterBellNotifications", () => {
  it("includes in-app notifications and excludes operational alerts", () => {
    const notification = sampleAlert({ alert_type: "DOCUMENTS_APPROVED" });
    const operational = sampleAlert({
      alert_type: "SHIPMENT_DELAYED",
      inbox_kind: "operational_alert",
      severity: "warning",
    });
    expect(filterBellNotifications([notification, operational])).toEqual([notification]);
  });

  it("excludes legacy message event types", () => {
    const messageRow = sampleAlert({ alert_type: "MESSAGE_NEW", severity: "warning" });
    const notification = sampleAlert();
    expect(filterBellNotifications([messageRow, notification])).toEqual([notification]);
  });
});

/** @deprecated alias */
describe("filterBellNotificationAlerts", () => {
  it("delegates to filterBellNotifications", () => {
    const notification = sampleAlert();
    expect(filterBellNotifications([notification])).toEqual([notification]);
  });
});

describe("filterInboxAlertsForViewer", () => {
  it("hides legacy message alerts triggered by the viewer", () => {
    expect(
      filterInboxAlertsForViewer([sampleAlert({ alert_type: "MESSAGE_NEW" })], "user-1"),
    ).toEqual([]);
  });

  it("keeps legacy message alerts from other users", () => {
    const alert = sampleAlert({ alert_type: "MESSAGE_NEW", actor_user_id: "user-2" });
    expect(filterInboxAlertsForViewer([alert], "user-1")).toEqual([alert]);
  });

  it("keeps notifications from the viewer", () => {
    const alert = sampleAlert({ alert_type: "DOCUMENT_UPLOADED" });
    expect(filterInboxAlertsForViewer([alert], "user-1")).toEqual([alert]);
  });
});
