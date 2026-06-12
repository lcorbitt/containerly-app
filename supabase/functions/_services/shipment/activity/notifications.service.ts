import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { tryCreateServiceClient } from "@services/db.ts";
import {
  fetchProfileDisplayName,
  fetchShipmentOrderPhrase,
  notifyCustomersWithPortalAccess,
  notifyShipmentStakeholdersInApp,
} from "@services/notification/in-app-alerts.ts";
import { formatChangedFieldLabels, type CommercialFieldChange } from "@services/shipment/activity/edit.utils.ts";

const SKIP_NOTIFICATION_EVENT_TYPES = new Set([
  "drafts_attached",
  "documents_approved",
  "documents_rejected",
  "originals_mailed",
  "customer_message",
  "operator_message",
]);

function formatRiskLevelLabel(level: unknown): string {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return "Carrier Default";
  }
}

function notifyClientForCustomers(client: SupabaseClient): SupabaseClient {
  return tryCreateServiceClient() ?? client;
}

async function notifyOperatorsAndCustomers(
  client: SupabaseClient,
  args: {
    organizationId: string;
    shipmentId: string;
    actorUserId: string;
    alertType: string;
    message: string;
    details?: Record<string, unknown> | null;
  },
): Promise<void> {
  await notifyShipmentStakeholdersInApp(client, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    alertType: args.alertType,
    severity: "info",
    message: args.message,
    excludeUserId: args.actorUserId,
    actorUserId: args.actorUserId,
    details: args.details ?? null,
  });

  const customerClient = notifyClientForCustomers(client);
  await notifyCustomersWithPortalAccess(customerClient, {
    organizationId: args.organizationId,
    shipmentId: args.shipmentId,
    alertType: args.alertType,
    message: args.message,
    actorUserId: args.actorUserId,
    details: args.details ?? null,
  });
}

export async function notifyForShipmentActivityEvent(args: {
  client: SupabaseClient;
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (SKIP_NOTIFICATION_EVENT_TYPES.has(args.eventType)) return;

  const actorName = await fetchProfileDisplayName(args.client, args.actorUserId);
  const orderPhrase = await fetchShipmentOrderPhrase(args.client, args.shipmentId);
  const metadata = args.metadata ?? {};

  switch (args.eventType) {
    case "shipment_edited": {
      const changedFields = Array.isArray(metadata.changed_fields)
        ? (metadata.changed_fields as CommercialFieldChange[])
        : [];
      const fieldSummary = changedFields.length > 0
        ? formatChangedFieldLabels(changedFields)
        : "shipment details";
      await notifyOperatorsAndCustomers(args.client, {
        organizationId: args.organizationId,
        shipmentId: args.shipmentId,
        actorUserId: args.actorUserId,
        alertType: "SHIPMENT_EDITED",
        message: `${actorName} updated ${fieldSummary} on ${orderPhrase}.`,
        details: { changed_fields: changedFields },
      });
      break;
    }
    case "risk_status_updated": {
      const riskLabel = formatRiskLevelLabel(metadata.risk_level);
      await notifyOperatorsAndCustomers(args.client, {
        organizationId: args.organizationId,
        shipmentId: args.shipmentId,
        actorUserId: args.actorUserId,
        alertType: "RISK_STATUS_UPDATED",
        message: `${actorName} updated risk status to ${riskLabel} on ${orderPhrase}.`,
        details: {
          risk_level: metadata.risk_level ?? null,
          risk_message: metadata.risk_message ?? null,
        },
      });
      break;
    }
    case "shipment_created": {
      await notifyShipmentStakeholdersInApp(args.client, {
        organizationId: args.organizationId,
        shipmentId: args.shipmentId,
        alertType: "SHIPMENT_CREATED",
        severity: "info",
        message: `${actorName} created ${orderPhrase}.`,
        excludeUserId: args.actorUserId,
        actorUserId: args.actorUserId,
        details: metadata,
      });
      break;
    }
    case "tracking_linked": {
      const containerNumber = typeof metadata.container_number === "string"
        ? metadata.container_number.trim()
        : "";
      const containerPart = containerNumber ? ` for container ${containerNumber}` : "";
      await notifyShipmentStakeholdersInApp(args.client, {
        organizationId: args.organizationId,
        shipmentId: args.shipmentId,
        alertType: "TRACKING_LINKED",
        severity: "info",
        message: `${actorName} linked carrier tracking${containerPart} on ${orderPhrase}.`,
        excludeUserId: args.actorUserId,
        actorUserId: args.actorUserId,
        details: metadata,
      });
      break;
    }
    default:
      break;
  }
}
