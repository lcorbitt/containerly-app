export type ShipmentDocumentUploadGroup = "draft" | "revision" | "original";

export interface ShipmentDocumentUploadZoneProps {
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
  documentGroup: ShipmentDocumentUploadGroup;
  onDocumentGroupChange: (value: ShipmentDocumentUploadGroup) => void;
  uploading?: boolean;
  onUpload: (files: File[]) => void | Promise<void>;
}
