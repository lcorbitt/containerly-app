import { useMutation } from "@tanstack/react-query";
import {
  bulkCreateShipments,
  type BulkImportResult,
} from "@/services/shipment-import.service";
import {
  createCustomerInvite,
  createShipment,
  deleteShipment,
  deleteShipmentParticipantRow,
  createShipmentParticipant,
  revokeCustomerInviteRow,
  revokeShipmentCustomerAccessRow,
  updateShipment,
  updateShipmentAssignee,
  updateShipmentCustomerAccessSettings,
  updateShipmentNotificationSubscription,
  updateShipmentRisk,
  updateShipmentRootCause,
  updateShipmentTags,
} from "@/services/shipment.service";
import type {
  CreateShipmentBody,
  DeleteShipmentBody,
  UpdateShipmentBody,
  UpdateShipmentRiskBody,
} from "@shared/dto/logistics.dto";
import type { ShipmentRootCause } from "@shared/dto/performance.dto";
import type { ShipmentImportDraft } from "@/utils/shipment-import";

export function useUpdateShipmentRiskMutation() {
  return useMutation({
    mutationFn: (body: UpdateShipmentRiskBody) => updateShipmentRisk(body),
  });
}

export function useCreateShipmentMutation() {
  return useMutation({
    mutationFn: (body: CreateShipmentBody) => createShipment(body),
  });
}

export function useBulkCreateShipmentsMutation() {
  return useMutation({
    mutationFn: (args: {
      organizationId: string;
      drafts: Array<{ rowNumber: number; draft: ShipmentImportDraft }>;
      onProgress?: (completed: number, total: number) => void;
    }): Promise<BulkImportResult> =>
      bulkCreateShipments(args.organizationId, args.drafts, args.onProgress),
  });
}

export function useUpdateShipmentMutation() {
  return useMutation({
    mutationFn: (body: UpdateShipmentBody) => updateShipment(body),
  });
}

export function useDeleteShipmentMutation() {
  return useMutation({
    mutationFn: (body: DeleteShipmentBody) => deleteShipment(body),
  });
}

export function useUpdateShipmentAssigneeMutation() {
  return useMutation({
    mutationFn: (input: {
      shipmentId: string;
      organizationId: string;
      assigneeUserId: string | null;
    }) => updateShipmentAssignee(input),
  });
}

export function useCreateShipmentParticipantMutation() {
  return useMutation({
    mutationFn: (input: { organizationId: string; shipmentId: string; userId: string }) =>
      createShipmentParticipant(input),
  });
}

export function useDeleteShipmentParticipantMutation() {
  return useMutation({
    mutationFn: (participantRowId: string) => deleteShipmentParticipantRow(participantRowId),
  });
}

export function useCreateCustomerInviteMutation() {
  return useMutation({
    mutationFn: (args: {
      organizationId: string;
      shipmentId: string;
      invitedEmail: string;
      deliveryMode?: "email_invite" | "allowlist_only";
      visibilitySettings?: Record<string, unknown>;
    }) => createCustomerInvite(args),
  });
}

export function useRevokeCustomerInviteMutation() {
  return useMutation({
    mutationFn: (inviteId: string) => revokeCustomerInviteRow(inviteId),
  });
}

export function useRevokeShipmentCustomerAccessMutation() {
  return useMutation({
    mutationFn: (accessId: string) => revokeShipmentCustomerAccessRow(accessId),
  });
}

export function useUpdateShipmentTagsMutation() {
  return useMutation({
    mutationFn: (input: { shipmentId: string; organizationId: string; tags: string[] }) =>
      updateShipmentTags(input),
  });
}

export function useUpdateShipmentRootCauseMutation() {
  return useMutation({
    mutationFn: (input: {
      shipmentId: string;
      organizationId: string;
      rootCause: ShipmentRootCause | null;
    }) => updateShipmentRootCause(input),
  });
}

export function useUpdateShipmentNotificationSubscriptionMutation() {
  return useMutation({
    mutationFn: (input: { shipmentId: string; organizationId: string; subscribed: boolean }) =>
      updateShipmentNotificationSubscription(input),
  });
}

export function useUpdateShipmentCustomerAccessSettingsMutation() {
  return useMutation({
    mutationFn: (input: {
      accessId: string;
      visibilitySettings: Record<string, boolean>;
      operatorOverrides: Record<string, string>;
    }) => updateShipmentCustomerAccessSettings(input),
  });
}
