export interface TrackingRequestScopeRow {
  id: string;
  container_id: string | null;
  created_by: string | null;
}

export interface ContainerScopeRow {
  shipment_id: string | null;
}

export function isRequestInMyScope(
  r: TrackingRequestScopeRow,
  userId: string | null,
  participatingShipmentIds: ReadonlySet<string>,
  containersById: Record<string, ContainerScopeRow | undefined>,
  shipmentOwnerByShipmentId: Record<string, string | null | undefined>,
  shipmentAssigneeByShipmentId: Record<string, string | null | undefined>,
): boolean {
  if (!userId) return false;
  const shipmentId = r.container_id ? containersById[r.container_id]?.shipment_id : undefined;
  if (!shipmentId) return false;
  if (shipmentOwnerByShipmentId[shipmentId] === userId) return true;
  if (shipmentAssigneeByShipmentId[shipmentId] === userId) return true;
  if (participatingShipmentIds.has(shipmentId)) return true;
  const ownerUnset = shipmentOwnerByShipmentId[shipmentId] == null;
  const assigneeUnset = shipmentAssigneeByShipmentId[shipmentId] == null;
  if (ownerUnset && assigneeUnset && r.created_by === userId) return true;
  return false;
}
