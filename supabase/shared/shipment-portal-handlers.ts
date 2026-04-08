/**
 * Operator/importer portal + customer preview flows (Edge handlers call these from `@supabase-shared/`).
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  buildImporterGrantShipmentPayload,
  buildShipmentPortalPayload,
  DEFAULT_CUSTOMER_VISIBILITY,
  OPERATOR_SHIPMENT_PORTAL_VISIBILITY,
  type ShipmentPortalReportMeta,
} from "./shipment-portal-payload.ts";
import { fetchMembershipByOrgAndUser } from "@models/organization_members.ts";
import { fetchProfileRole } from "@models/profiles.ts";
import { fetchActiveAccessFull } from "@models/shipment_customer_access.ts";
import { fetchShipmentIdAndOrganization, fetchShipmentPortalOperatorRow } from "@models/shipments.ts";
import type { ShipmentPortalPayload } from "@shared/dto/shipment.dto.ts";

type PortalResult =
  | { ok: true; payload: ShipmentPortalPayload }
  | { ok: false; status: number; error: string };

export async function getShipmentForOperator(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  shipmentId: string,
): Promise<PortalResult> {
  const { data: shipment, error: shErr } = await fetchShipmentPortalOperatorRow(userClient, shipmentId);

  if (shErr) return { ok: false, status: 500, error: shErr.message };
  if (!shipment) return { ok: false, status: 404, error: "Shipment not found" };

  const [{ data: membership }, { data: profile }] = await Promise.all([
    fetchMembershipByOrgAndUser(userClient, shipment.organization_id as string, userId),
    fetchProfileRole(userClient, userId),
  ]);

  const isPlatformSuperadmin = (profile?.role as string | undefined) === "superadmin";

  if (membership || isPlatformSuperadmin) {
    const reportMeta: ShipmentPortalReportMeta = {
      id: shipment.id as string,
      title: null,
      created_at: shipment.created_at as string,
      expires_at: null,
    };

    const result = await buildShipmentPortalPayload(
      admin,
      shipmentId,
      OPERATOR_SHIPMENT_PORTAL_VISIBILITY,
      {},
      reportMeta,
      null,
      { includeInternalMessages: true },
    );

    if (!result.ok) return result;

    const payload = result.payload as Record<string, unknown>;
    payload.viewer = "operator";
    payload.shipment_id = shipmentId;
    return { ok: true, payload: payload as unknown as ShipmentPortalPayload };
  }

  const { data: access, error: accErr } = await fetchActiveAccessFull(userClient, shipmentId, userId);

  if (accErr) return { ok: false, status: 500, error: accErr.message };
  if (!access) return { ok: false, status: 403, error: "No access to this shipment" };

  const grantResult = await buildImporterGrantShipmentPayload(admin, access as Record<string, unknown>);
  if (!grantResult.ok) return grantResult;

  const payload = grantResult.payload as Record<string, unknown>;
  payload.viewer = "importer";
  return { ok: true, payload: payload as unknown as ShipmentPortalPayload };
}

export async function previewShipmentForImporter(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  shipmentId: string,
  visibilitySettings: Record<string, unknown>,
  operatorOverrides: Record<string, unknown>,
): Promise<PortalResult> {
  const { data: row, error: shErr } = await fetchShipmentIdAndOrganization(userClient, shipmentId);

  if (shErr || !row) {
    return { ok: false, status: 404, error: "Shipment not found or access denied" };
  }

  const visibility = {
    ...DEFAULT_CUSTOMER_VISIBILITY,
    ...(visibilitySettings && typeof visibilitySettings === "object" ? visibilitySettings : {}),
  };
  const overrides =
    operatorOverrides && typeof operatorOverrides === "object" ? operatorOverrides : {};

  const reportMeta: ShipmentPortalReportMeta = {
    id: "preview",
    title: "Customer preview",
    created_at: new Date().toISOString(),
    expires_at: null,
  };

  const result = await buildShipmentPortalPayload(
    admin,
    shipmentId,
    visibility,
    overrides,
    reportMeta,
    null,
    undefined,
  );

  if (!result.ok) return result;

  const payload = result.payload as Record<string, unknown>;
  payload.preview = true;
  return { ok: true, payload: payload as unknown as ShipmentPortalPayload };
}
