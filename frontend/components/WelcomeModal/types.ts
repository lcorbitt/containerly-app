export interface WelcomeModalProps {
  open: boolean;
  displayName: string;
  onClose: () => void;
  onAddShipment: () => void;
  onInviteTeam: () => void;
}
