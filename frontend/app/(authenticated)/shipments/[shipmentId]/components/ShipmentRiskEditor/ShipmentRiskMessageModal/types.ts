export interface ShipmentRiskMessageModalProps {
  open: boolean;
  message: string;
  saving: boolean;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}
