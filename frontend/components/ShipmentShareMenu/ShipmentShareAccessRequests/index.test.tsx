import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShipmentShareAccessRequests } from "./index";
import { createMockShareState, mockAccessRequest } from "../test-utils";

describe("ShipmentShareAccessRequests", () => {
  it("renders nothing while loading", () => {
    const { container } = render(
      <ShipmentShareAccessRequests
        state={createMockShareState({
          loading: true,
          pendingAccessRequests: [mockAccessRequest()],
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no pending requests", () => {
    const { container } = render(
      <ShipmentShareAccessRequests state={createMockShareState({ pendingAccessRequests: [] })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders requests and calls resolveAccessRequestRow", async () => {
    const user = userEvent.setup();
    const state = createMockShareState({
      pendingAccessRequests: [mockAccessRequest({ id: "req-42", requester_email: "alice@example.com" })],
    });
    render(<ShipmentShareAccessRequests state={state} />);

    expect(screen.getByText("Access requests")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(state.resolveAccessRequestRow).toHaveBeenCalledWith("req-42", "approve");

    await user.click(screen.getByRole("button", { name: "Deny" }));
    expect(state.resolveAccessRequestRow).toHaveBeenCalledWith("req-42", "deny");
  });
});
