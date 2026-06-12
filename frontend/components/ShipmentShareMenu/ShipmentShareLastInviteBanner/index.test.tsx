import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { TestConfirmToastHosts } from "@/test-utils/app-hosts";
import { ShipmentShareLastInviteBanner } from "./index";

function renderWithConfirm(ui: ReactNode) {
  return render(<TestConfirmToastHosts>{ui}</TestConfirmToastHosts>);
}

describe("ShipmentShareLastInviteBanner", () => {
  it("shows full URL and copies on button click", async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    const onDismiss = vi.fn();

    renderWithConfirm(
      <ShipmentShareLastInviteBanner
        url="/invite/accept?token=abc"
        origin="https://app.example.com"
        onDismiss={onDismiss}
        onToast={onToast}
      />,
    );

    expect(screen.getByText("https://app.example.com/invite/accept?token=abc")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /copy link/i }));
    await waitFor(() => {
      expect(onToast).toHaveBeenCalledWith("Link copied", "success");
    });
  });

  it("calls onDismiss when Dismiss is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    renderWithConfirm(
      <ShipmentShareLastInviteBanner
        url="https://app.example.com/hub"
        origin="https://app.example.com"
        onDismiss={onDismiss}
        onToast={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
