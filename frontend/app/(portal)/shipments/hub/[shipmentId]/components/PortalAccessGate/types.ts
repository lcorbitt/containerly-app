export interface PortalAccessGateProps {
  shipmentId: string;
  /** When signed in but denied, reuse the same email flow. */
  showSignedInHint?: boolean;
  /** Called after a session is established so the page can re-run its gate check in place. */
  onSignedIn?: () => void;
}
