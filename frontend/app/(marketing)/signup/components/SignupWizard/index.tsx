"use client";

import { SignupAccountStep } from "../SignupAccountStep";
import { SignupInviteTeamStep } from "../SignupInviteTeamStep";
import { SignupOrganizationStep } from "../SignupOrganizationStep";
import {
  SIGNUP_WIZARD_CARD_CLASS,
  SIGNUP_WIZARD_PROGRESS_CLASS,
  SIGNUP_WIZARD_STEP_DOT_ACTIVE_CLASS,
  SIGNUP_WIZARD_STEP_DOT_BASE_CLASS,
  SIGNUP_WIZARD_STEP_DOT_INACTIVE_CLASS,
  SIGNUP_WIZARD_STEP_LABELS,
} from "./constants";
import type { SignupWizardProps } from "./types";
import { useSignupWizard } from "./useSignupWizard";

export function SignupWizard({ initialStep, initialError = null }: SignupWizardProps) {
  const wizard = useSignupWizard(initialStep);

  if (!wizard.sessionChecked || (wizard.hasSession && wizard.statusLoading)) {
    return (
      <div className={SIGNUP_WIZARD_CARD_CLASS}>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className={SIGNUP_WIZARD_CARD_CLASS}>
      <div className={SIGNUP_WIZARD_PROGRESS_CLASS} aria-label="Sign-up progress">
        {([1, 2, 3] as const).map((n) => (
          <span
            key={n}
            className={`${SIGNUP_WIZARD_STEP_DOT_BASE_CLASS} ${
              wizard.step >= n
                ? SIGNUP_WIZARD_STEP_DOT_ACTIVE_CLASS
                : SIGNUP_WIZARD_STEP_DOT_INACTIVE_CLASS
            }`}
            aria-hidden
          />
        ))}
      </div>

      <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Step {wizard.step} of 3
      </p>
      <h1 className="mt-1 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {SIGNUP_WIZARD_STEP_LABELS[wizard.step]}
      </h1>

      {wizard.step === 1 ? (
        <SignupAccountStep
          onContinue={() => wizard.goToStep(2)}
          onBack={wizard.goBackToLogin}
          initialError={initialError}
        />
      ) : null}

      {wizard.step === 2 ? (
        <SignupOrganizationStep
          pendingInvite={wizard.pendingInvite}
          organizationId={wizard.organizationId}
          onOrganizationIdReady={wizard.onOrganizationIdReady}
          onComplete={wizard.onOrganizationStepComplete}
          onBack={wizard.goBack}
        />
      ) : null}

      {wizard.step === 3 ? (
        <SignupInviteTeamStep
          organizationId={wizard.organizationId}
          onSkip={wizard.finishSignup}
          onComplete={wizard.finishSignup}
          onBack={wizard.goBack}
        />
      ) : null}
    </div>
  );
}
