"use client";

import { OperatorShipmentsOverview } from "./components/OperatorShipmentsOverview";
import { ImporterShipmentsList } from "@/components/ImporterShipmentsList";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";

function useFreightOperator() {
  const { orgs, isSuperAdmin } = useOrganizationWorkspace();
  return (
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null)
  );
}

export default function ShipmentsPage() {
  const freight = useFreightOperator();
  if (freight) {
    return <OperatorShipmentsOverview pageTitle="Shipments" />;
  }
  return <ImporterShipmentsList />;
}
