export interface OrganizationImageSettingsProps {
  organizationId: string;
  organizationName: string;
  initialOrgImagePath: string | null;
  onPathUpdated?: (path: string | null) => void;
}
