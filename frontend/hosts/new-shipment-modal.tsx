"use client";

import {
  NewShipmentBulkImportModal,
  NewShipmentModal,
} from "@/components/NewShipmentModal";
import { useNewShipmentModal } from "@/components/NewShipmentModal/useNewShipmentModal";

export { useNewShipmentModalControls } from "@/atoms/new-shipment-modal";

export function NewShipmentModalHost({ children }: { children: React.ReactNode }) {
  const modal = useNewShipmentModal();

  return (
    <>
      {children}
      <NewShipmentModal
        open={modal.open}
        onClose={modal.close}
        selectedOrgId={modal.selectedOrgId}
        creatingShipment={modal.creatingShipment}
        importOpen={modal.importOpen}
        onImportOpenChange={modal.setImportOpen}
        onCreated={modal.afterCreated}
        onSwitchToBulkImport={modal.switchToBulkImport}
        onCreatingChange={modal.setCreatingShipment}
      />
      <NewShipmentBulkImportModal
        open={modal.bulkImportOpen}
        onClose={modal.closeBulkImport}
        selectedOrgId={modal.selectedOrgId}
        onBulkComplete={modal.onBulkComplete}
      />
    </>
  );
}
