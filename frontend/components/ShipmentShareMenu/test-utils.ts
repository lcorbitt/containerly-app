import { vi } from "vitest";
import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import type { ToastVariant } from "@/contexts/toast";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentCustomerAccessRequest,
} from "@/types/database";

export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const SHIPMENT_ID = "22222222-2222-4222-8222-222222222222";

export function createMockShareState(
  overrides: Partial<ShipmentAccessTabContentState> = {},
): ShipmentAccessTabContentState {
  const toast = vi.fn<(message: string, variant?: ToastVariant, durationMs?: number) => void>();

  return {
    selectedOrgId: ORG_ID,
    loading: false,
    assigneeUserId: null,
    assigneeSaving: false,
    assigneeSelectOptions: [],
    updateAssignee: vi.fn(),
    participantBusy: false,
    removingParticipantId: null,
    participantRowsWithoutAssignee: [],
    participantsMenuOptions: [],
    addParticipantUser: vi.fn(),
    removeParticipantRow: vi.fn(),
    profileImagePathByUserId: {},
    messageAuthorByUserId: {},
    inviteEmail: "",
    setInviteEmail: vi.fn(),
    inviteFieldError: null,
    inviteDeliveryMode: "email_invite",
    setInviteDeliveryMode: vi.fn(),
    inviteCreating: false,
    lastInviteUrl: null,
    setLastInviteUrl: vi.fn(),
    pendingInvites: [],
    pendingAccessRequests: [],
    resolvingRequestId: null,
    resolveAccessRequestRow: vi.fn().mockResolvedValue(undefined),
    activeAccessWithLabels: [],
    origin: "https://app.example.com",
    createInvite: vi.fn().mockResolvedValue(undefined),
    revokeInviteRow: vi.fn().mockResolvedValue(undefined),
    revokeAccessRow: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(undefined),
    toast,
    tags: [],
    orgTagSuggestions: [],
    applySavedTags: vi.fn(),
    emailNotificationsSubscribed: false,
    ...overrides,
  };
}

export function mockAccessRequest(
  overrides: Partial<ShipmentCustomerAccessRequest> = {},
): ShipmentCustomerAccessRequest {
  return {
    id: "req-1",
    shipment_id: SHIPMENT_ID,
    organization_id: ORG_ID,
    requester_email: "requester@example.com",
    status: "pending",
    requested_at: "2026-01-01T00:00:00Z",
    resolved_at: null,
    resolved_by_user_id: null,
    invite_id: null,
    access_id: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function mockActiveAccess(
  overrides: Partial<ShipmentCustomerAccess> = {},
): ShipmentCustomerAccess {
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

export function mockPendingInvite(overrides: Partial<CustomerInvite> = {}): CustomerInvite {
  return {
    id: "invite-1",
    organization_id: ORG_ID,
    shipment_id: SHIPMENT_ID,
    invited_email: "pending@example.com",
    invited_by_user_id: "operator-1",
    token_hash: "hash",
    status: "pending",
    expires_at: "2026-12-31T00:00:00Z",
    accepted_at: null,
    accepted_by_user_id: null,
    visibility_settings: {},
    delivery_mode: "email_invite",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function getShareMenuTrigger() {
  return document.querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement;
}
