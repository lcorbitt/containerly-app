/** `list-alerts` — GET query contract. */
export interface ListAlertsQuery {
  scope: "org" | "me";
  organization_id?: string;
  limit?: number;
}

/** `list-alerts` — response envelope. */
export interface ListAlertsResponse {
  alerts: Record<string, unknown>[];
}

/** `acknowledge-alert` — PATCH body. */
export interface AcknowledgeAlertBody {
  alert_id: string;
}

/** `acknowledge-all-alerts` — PATCH body. */
export interface AcknowledgeAllAlertsBody {
  scope: "org" | "me";
  organization_id?: string;
}

/** Shared acknowledge response. */
export interface AcknowledgeAlertsResponse {
  ok: true;
  acknowledged?: number;
}
