import { assertEquals } from "@std/assert";
import {
  buildCommercialEditChanges,
  formatChangedFieldLabels,
  isMailOrWorkflowOnlyUpdate,
} from "./edit.utils.ts";

Deno.test("buildCommercialEditChanges returns empty when values are unchanged", () => {
  const existing = {
    order_number: "ORD-1",
    port_of_destination: "Singapore",
    customer_name: null,
  };
  const updateFields = {
    order_number: "ORD-1",
    port_of_destination: "Singapore",
    customer_name: "",
  };

  assertEquals(buildCommercialEditChanges(existing, updateFields), []);
});

Deno.test("buildCommercialEditChanges detects header changes with label metadata", () => {
  const existing = {
    port_of_destination: "Shanghai",
    estimated_departure_at: "2026-06-01T00:00:00.000Z",
  };
  const updateFields = {
    port_of_destination: "Singapore",
    estimated_departure_at: "2026-06-10T00:00:00.000Z",
  };

  const changes = buildCommercialEditChanges(existing, updateFields);
  assertEquals(changes, [
    {
      field: "port_of_destination",
      label: "Port of Destination",
      previous: "Shanghai",
      next: "Singapore",
    },
    {
      field: "estimated_departure_at",
      label: "Est Date of Departure",
      previous: "2026-06-01",
      next: "2026-06-10",
    },
  ]);
  assertEquals(
    formatChangedFieldLabels(changes),
    "Port of Destination, Est Date of Departure",
  );
});

Deno.test("isMailOrWorkflowOnlyUpdate ignores commercial fields mixed with mail fields", () => {
  assertEquals(
    isMailOrWorkflowOnlyUpdate({
      physical_mail_tracking_number: "1Z999",
      workflow_status: "originals_sent",
    }),
    true,
  );
  assertEquals(
    isMailOrWorkflowOnlyUpdate({
      physical_mail_tracking_number: "1Z999",
      order_number: "ORD-2",
    }),
    false,
  );
});
