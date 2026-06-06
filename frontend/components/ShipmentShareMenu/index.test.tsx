import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ShipmentShareMenu } from "./index";
import { createMockShareState, getShareMenuTrigger, mockAccessRequest, mockPendingInvite } from "./test-utils";

const SHIPMENT_ID = "22222222-2222-4222-8222-222222222222";

describe("ShipmentShareMenu", () => {
  it("renders Share trigger without badge when nothing is pending", () => {
    render(<ShipmentShareMenu shipmentId={SHIPMENT_ID} state={createMockShareState()} />);
    expect(getShareMenuTrigger()).toBeInTheDocument();
    expect(screen.queryByLabelText(/pending/i)).not.toBeInTheDocument();
  });

  it("shows attention badge for pending requests and invites", () => {
    render(
      <ShipmentShareMenu
        shipmentId={SHIPMENT_ID}
        state={createMockShareState({
          pendingAccessRequests: [mockAccessRequest()],
          pendingInvites: [mockPendingInvite()],
        })}
      />,
    );
    expect(screen.getByLabelText("2 pending")).toHaveTextContent("2");
  });

  it("opens share dialog on trigger click", async () => {
    const user = userEvent.setup();
    render(<ShipmentShareMenu shipmentId={SHIPMENT_ID} state={createMockShareState()} />);

    await user.click(getShareMenuTrigger());

    expect(screen.getByRole("dialog", { name: "Share shipment" })).toBeInTheDocument();
    expect(getShareMenuTrigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("shows invite field error alert", async () => {
    const user = userEvent.setup();
    render(
      <ShipmentShareMenu
        shipmentId={SHIPMENT_ID}
        state={createMockShareState({
          inviteFieldError: "This email belongs to someone on your organization team.",
        })}
      />,
    );

    await user.click(getShareMenuTrigger());

    expect(screen.getByRole("alert")).toHaveTextContent("organization team");
  });

  it("calls createInvite from Share button and Enter key", async () => {
    const user = userEvent.setup();
    const state = createMockShareState({ inviteEmail: "importer@example.com" });
    render(<ShipmentShareMenu shipmentId={SHIPMENT_ID} state={state} />);

    await user.click(getShareMenuTrigger());

    const dialog = screen.getByRole("dialog", { name: "Share shipment" });
    await user.click(within(dialog).getByRole("button", { name: /^share$/i }));
    expect(state.createInvite).toHaveBeenCalledTimes(1);

    await user.keyboard("{Enter}");
    expect(state.createInvite).toHaveBeenCalledTimes(2);
  });

  it("copies hub link and shows success toast", async () => {
    const user = userEvent.setup();
    const state = createMockShareState();
    render(<ShipmentShareMenu shipmentId={SHIPMENT_ID} state={state} />);

    await user.click(getShareMenuTrigger());
    const dialog = screen.getByRole("dialog", { name: "Share shipment" });
    await user.click(within(dialog).getByRole("button", { name: /copy link/i }));

    await waitFor(() => {
      expect(state.toast).toHaveBeenCalledWith("Link copied", "success");
    });
  });

  it("shows toast error when clipboard write fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"));
    const state = createMockShareState();
    render(<ShipmentShareMenu shipmentId={SHIPMENT_ID} state={state} />);

    await user.click(getShareMenuTrigger());
    const dialog = screen.getByRole("dialog", { name: "Share shipment" });
    await user.click(within(dialog).getByRole("button", { name: /copy link/i }));

    await waitFor(() => {
      expect(state.toast).toHaveBeenCalledWith("Could not copy", "error");
    });
  });
});
