export interface PortalAccessGateProps {
  shipmentId: string;
  /** When signed in but denied, reuse the same email flow. */
  showSignedInHint?: boolean;
}
