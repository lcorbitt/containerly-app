import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { TestConfirmToastHosts } from "@/test-utils/app-hosts";
import type { ShipmentShareAccessRow } from "../types";
import { ShipmentSharePeopleList } from "./index";
import { createMockShareState } from "../test-utils";

vi.mock("../ShipmentShareImporterSettingsDialog", () => ({
  ShipmentShareImporterSettingsDialog: () => null,
}));

function renderWithConfirm(ui: ReactNode) {
  return render(<TestConfirmToastHosts>{ui}</TestConfirmToastHosts>);
}

function confirmDialog() {
  return screen.getByRole("alertdialog");
}

const pendingRow: ShipmentShareAccessRow = {
  id: "invite-1",
  kind: "pending",
  label: "pending@example.com",
  sublabel: "Invite pending",
  avatarUrl: null,
  role: "Pending",
};

const activeRow: ShipmentShareAccessRow = {
  id: "access-1",
  kind: "active",
  label: "customer@example.com",
  avatarUrl: null,
  access: {
    id: "access-1",
    shipment_id: "22222222-2222-4222-8222-222222222222",
    organization_id: "11111111-1111-4111-8111-111111111111",
    customer_user_id: "user-1",
    invite_id: null,
    visibility_settings: {},
    operator_overrides: {},
    configuration_reminder_due_at: null,
    profile_completed_at: null,
    revoked_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

describe("ShipmentSharePeopleList", () => {
  it("revokes pending invite after confirmation", async () => {
    const user = userEvent.setup();
    const state = createMockShareState();

    renderWithConfirm(<ShipmentSharePeopleList rows={[pendingRow]} state={state} />);

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    await user.click(within(confirmDialog()).getByRole("button", { name: "Revoke" }));

    expect(state.revokeInviteRow).toHaveBeenCalledWith("invite-1");
  });

  it("revokes active access after confirmation", async () => {
    const user = userEvent.setup();
    const state = createMockShareState();

    renderWithConfirm(<ShipmentSharePeopleList rows={[activeRow]} state={state} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(within(confirmDialog()).getByRole("button", { name: "Revoke" }));

    expect(state.revokeAccessRow).toHaveBeenCalledWith("access-1");
  });

  it("does not revoke when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const state = createMockShareState();

    renderWithConfirm(<ShipmentSharePeopleList rows={[pendingRow]} state={state} />);

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    await user.click(within(confirmDialog()).getByRole("button", { name: "Cancel" }));

    expect(state.revokeInviteRow).not.toHaveBeenCalled();
  });
});
