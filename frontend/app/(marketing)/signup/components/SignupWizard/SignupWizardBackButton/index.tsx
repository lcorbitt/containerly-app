"use client";

import { ChevronLeft } from "lucide-react";
import { SIGNUP_WIZARD_BACK_BUTTON_CLASS, SIGNUP_WIZARD_BACK_LABEL } from "./constants";
import type { SignupWizardBackButtonProps } from "./types";

export function SignupWizardBackButton({ onClick, disabled = false }: SignupWizardBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={SIGNUP_WIZARD_BACK_BUTTON_CLASS}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      {SIGNUP_WIZARD_BACK_LABEL}
    </button>
  );
}
