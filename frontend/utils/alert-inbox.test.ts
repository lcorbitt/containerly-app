import { describe, expect, it } from "vitest";
import { filterInboxAlertsForViewer } from "./alert-inbox";
import type { Alert } from "@/types/database";

function messageAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "alert-1",
    organization_id: "org-1",
    shipment_id: "ship-1",
    container_id: null,
    alert_type: "MESSAGE_NEW",
    severity: "warning",
    message: "You on Order No. 123: hello",
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: "2026-06-07T12:00:00.000Z",
    recipient_user_id: null,
    actor_user_id: "user-1",
    report_message_id: "msg-1",
    details: null,
    ...overrides,
  };
}

describe("filterInboxAlertsForViewer", () => {
  it("hides message alerts triggered by the viewer", () => {
    expect(filterInboxAlertsForViewer([messageAlert()], "user-1")).toEqual([]);
  });

  it("keeps message alerts from other users", () => {
    const alert = messageAlert({ actor_user_id: "user-2" });
    expect(filterInboxAlertsForViewer([alert], "user-1")).toEqual([alert]);
  });

  it("keeps non-message alerts from the viewer", () => {
    const alert = messageAlert({ alert_type: "DOCUMENT_UPLOADED" });
    expect(filterInboxAlertsForViewer([alert], "user-1")).toEqual([alert]);
  });
});
