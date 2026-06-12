"use client";

import { WelcomeModal } from "@/components/WelcomeModal";
import { useWelcomeModal } from "@/components/WelcomeModal/useWelcomeModal";

export { useWelcomeModalControls } from "@/atoms/welcome-modal";

interface WelcomeModalHostProps {
  userId: string;
  fullName: string | null;
  email: string;
  children: React.ReactNode;
}

export function WelcomeModalHost({ userId, fullName, email, children }: WelcomeModalHostProps) {
  const modal = useWelcomeModal({
    fullName,
    email,
    userId,
  });

  return (
    <>
      {children}
      <WelcomeModal
        open={modal.open}
        displayName={modal.displayName}
        onClose={modal.close}
        onAddShipment={modal.onAddShipment}
        onInviteTeam={modal.onInviteTeam}
      />
    </>
  );
}
