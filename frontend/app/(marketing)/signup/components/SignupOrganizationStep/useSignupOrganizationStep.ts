"use client";

import { useState } from "react";
import { useSignupDraft } from "@/atoms/signup-draft";

interface UseSignupOrganizationStepInput {
  suggestedOrgName: string;
  onContinue: () => void;
}

export function useSignupOrganizationStep({
  suggestedOrgName,
  onContinue,
}: UseSignupOrganizationStepInput) {
  const { draft, patchDraft } = useSignupDraft();

  const [name, setName] = useState(
    draft.organization?.name || suggestedOrgName,
  );
  const [teamSize, setTeamSize] = useState(draft.organization?.teamSize ?? "");
  const [monthlyShipmentVolume, setMonthlyShipmentVolume] = useState(
    draft.organization?.monthlyShipmentVolume ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const trimmedName = (name.trim() || suggestedOrgName).trim();
    if (!trimmedName) {
      setMessage("Team name is required.");
      return;
    }
    if (!teamSize) {
      setMessage("Please select your team size.");
      return;
    }
    if (!monthlyShipmentVolume) {
      setMessage("Please select your monthly shipment volume.");
      return;
    }

    patchDraft({
      organization: {
        name: trimmedName,
        teamSize,
        monthlyShipmentVolume,
      },
    });
    onContinue();
  }

  return {
    name: name || suggestedOrgName,
    setName,
    teamSize,
    setTeamSize,
    monthlyShipmentVolume,
    setMonthlyShipmentVolume,
    message,
    submit,
  };
}
