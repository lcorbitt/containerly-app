export interface NewShipmentFormProps {
  organizationId: string;
  onCreated?: (shipmentId: string) => void | Promise<void>;
  showChrome?: boolean;
  className?: string;
  importOpen?: boolean;
  onImportOpenChange?: (open: boolean) => void;
  onSwitchToBulkImport?: () => void;
  onCreatingChange?: (creating: boolean) => void;
}
