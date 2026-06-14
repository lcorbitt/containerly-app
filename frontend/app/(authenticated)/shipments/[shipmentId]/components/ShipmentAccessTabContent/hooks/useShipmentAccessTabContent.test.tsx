import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { TestAppHosts } from "@/test-utils/app-hosts";
import { ORG_ID } from "@/components/ShipmentShareMenu/test-utils";
import { useShipmentAccessTabContent } from "./useShipmentAccessTabContent";
import {
  ACCESS_REQUEST_ID,
  SHIPMENT_ID,
  emptySnapshot,
} from "@/test/msw/share-handlers";
import { CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR } from "@/utils/customer-invite-errors";

const { mockGetShipmentAccessTab, mockCreateCustomerInvite, mockResolveAccessRequest } =
  vi.hoisted(() => ({
    mockGetShipmentAccessTab: vi.fn(),
    mockCreateCustomerInvite: vi.fn(),
    mockResolveAccessRequest: vi.fn(),
  }));

vi.mock("@/services/shipment.service", () => ({
  getShipmentAccessTab: mockGetShipmentAccessTab,
  createCustomerInvite: mockCreateCustomerInvite,
  resolveCustomerAccessRequest: mockResolveAccessRequest,
  deleteShipmentParticipantRow: vi.fn(),
  createShipmentParticipant: vi.fn(),
  revokeCustomerInviteRow: vi.fn(),
  revokeShipmentCustomerAccessRow: vi.fn(),
  updateShipmentAssignee: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <TestAppHosts org={{ selectedOrgId: ORG_ID }}>{children}</TestAppHosts>
    </QueryClientProvider>
  );
}

function hookOptions(onMetaChanged = vi.fn()) {
  return {
    shipmentId: SHIPMENT_ID,
    initialAssigneeUserId: null,
    onMetaChanged,
    organizationId: ORG_ID,
  };
}

describe("useShipmentAccessTabContent", () => {
  beforeEach(() => {
    mockGetShipmentAccessTab.mockResolvedValue(emptySnapshot);
    mockCreateCustomerInvite.mockReset();
    mockResolveAccessRequest.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads access tab snapshot on mount", async () => {
    mockGetShipmentAccessTab.mockResolvedValue({
      ...emptySnapshot,
      pendingInvites: [
        {
          id: "invite-1",
          organization_id: ORG_ID,
          shipment_id: SHIPMENT_ID,
          invited_email: "pending@example.com",
          invited_by_user_id: "operator-1",
          token_hash: "hash",
          status: "pending" as const,
          expires_at: "2026-12-31T00:00:00Z",
          visibility_settings: {},
          delivery_mode: "email_invite" as const,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const { result } = renderHook(() => useShipmentAccessTabContent(hookOptions()), { wrapper });

    await waitFor(() => expect(mockGetShipmentAccessTab).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pendingInvites).toHaveLength(1);
    expect(result.current.pendingInvites[0]?.invited_email).toBe("pending@example.com");
  });

  it("creates invite successfully and sets lastInviteUrl", async () => {
    mockCreateCustomerInvite.mockResolvedValue({
      ok: true,
      invite_url: "/invite/accept?token=abc123",
      expires_at: "2026-12-31T00:00:00Z",
    });

    const { result } = renderHook(() => useShipmentAccessTabContent(hookOptions()), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setInviteEmail("importer@example.com");
    });

    await act(async () => {
      await result.current.createInvite();
    });

    await waitFor(() => {
      expect(result.current.lastInviteUrl).toBe(
        `${window.location.origin}/invite/accept?token=abc123`,
      );
    });
    expect(result.current.inviteEmail).toBe("");
    expect(mockCreateCustomerInvite).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      shipmentId: SHIPMENT_ID,
      invitedEmail: "importer@example.com",
      deliveryMode: "email_invite",
    });
  });

  it("sets inviteFieldError for operator email failures", async () => {
    mockCreateCustomerInvite.mockResolvedValue({
      ok: false,
      status: 400,
      error: CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR,
    });

    const { result } = renderHook(() => useShipmentAccessTabContent(hookOptions()), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setInviteEmail("operator@example.com");
    });

    await act(async () => {
      await result.current.createInvite();
    });

    await waitFor(() => {
      expect(result.current.inviteFieldError).toBe(CUSTOMER_INVITE_OPERATOR_EMAIL_ERROR);
    });
  });

  it("resolves access request and reloads snapshot", async () => {
    mockGetShipmentAccessTab
      .mockResolvedValueOnce({
        ...emptySnapshot,
        pendingAccessRequests: [
          {
            id: ACCESS_REQUEST_ID,
            organization_id: ORG_ID,
            shipment_id: SHIPMENT_ID,
            requester_email: "requester@example.com",
            status: "pending" as const,
            requested_at: "2026-01-01T00:00:00Z",
            resolved_at: null,
            resolved_by_user_id: null,
            invite_id: null,
            access_id: null,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce(emptySnapshot);
    mockResolveAccessRequest.mockResolvedValue({
      ok: true,
      status: "approved",
      shipment_id: SHIPMENT_ID,
    });

    const onMetaChanged = vi.fn();
    const { result } = renderHook(() => useShipmentAccessTabContent(hookOptions(onMetaChanged)), {
      wrapper,
    });

    await waitFor(() => expect(result.current.pendingAccessRequests).toHaveLength(1));

    await act(async () => {
      await result.current.resolveAccessRequestRow(ACCESS_REQUEST_ID, "approve");
    });

    await waitFor(() => {
      expect(result.current.pendingAccessRequests).toHaveLength(0);
    });
    expect(mockResolveAccessRequest).toHaveBeenCalledWith({
      accessRequestId: ACCESS_REQUEST_ID,
      action: "approve",
    });
    expect(onMetaChanged).toHaveBeenCalled();
  });
});
