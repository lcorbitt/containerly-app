"use client";

import {
  LOGIN_FORM_FIELDS_CLASS,
  LOGIN_FORM_SUBMIT_CLASS,
  LOGIN_FORM_SUBMIT_INNER_CLASS,
} from "@/app/(marketing)/login/components/LoginForm/constants";
import { CustomSelect } from "@/components/CustomSelect";
import type { OrganizationMemberRole } from "@/types/database";
import {
  SIGNUP_INVITE_ADD_BUTTON_CLASS,
  SIGNUP_INVITE_ADD_PERSON_LABEL,
  SIGNUP_INVITE_EMAIL_LABEL,
  SIGNUP_INVITE_FIELD_LABEL_CLASS,
  SIGNUP_INVITE_INPUT_CLASS,
  SIGNUP_INVITE_ROLE_LABEL,
  SIGNUP_INVITE_ROLE_OPTIONS,
  SIGNUP_INVITE_SELECT_SHELL_CLASS,
  SIGNUP_INVITE_NEXT_LABEL,
  SIGNUP_INVITE_NEXT_LOADING_LABEL,
  SIGNUP_INVITE_SKIP_BLURB,
  SIGNUP_INVITE_SKIP_BUTTON_CLASS,
  SIGNUP_INVITE_SKIP_LABEL,
} from "./constants";
import { SignupWizardBackButton } from "../SignupWizard/SignupWizardBackButton";
import type { SignupInviteTeamStepProps } from "./types";
import { useSignupInviteTeamStep } from "./useSignupInviteTeamStep";

export function SignupInviteTeamStep({
  organizationId,
  onSkip,
  onComplete,
  onBack,
}: SignupInviteTeamStepProps) {
  const step = useSignupInviteTeamStep({ organizationId, onComplete });

  return (
    <div className="mt-6 space-y-4">
      <SignupWizardBackButton onClick={onBack} disabled={step.loading} />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Invite colleagues to collaborate on shipments. This step is optional.
      </p>

      <div className={LOGIN_FORM_FIELDS_CLASS}>
        {step.rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className={SIGNUP_INVITE_FIELD_LABEL_CLASS} htmlFor={`invite-email-${row.id}`}>
                {SIGNUP_INVITE_EMAIL_LABEL}
              </label>
              <input
                id={`invite-email-${row.id}`}
                type="email"
                autoComplete="off"
                className={SIGNUP_INVITE_INPUT_CLASS}
                placeholder="colleague@company.com"
                value={row.email}
                onChange={(e) => step.updateRow(row.id, { email: e.target.value })}
                disabled={step.loading}
              />
            </div>
            <div className="w-full sm:w-36">
              <label
                className={SIGNUP_INVITE_FIELD_LABEL_CLASS}
                id={`invite-role-label-${row.id}`}
                htmlFor={`invite-role-${row.id}`}
              >
                {SIGNUP_INVITE_ROLE_LABEL}
              </label>
              <div className={SIGNUP_INVITE_SELECT_SHELL_CLASS}>
                <CustomSelect
                  id={`invite-role-${row.id}`}
                  aria-labelledby={`invite-role-label-${row.id}`}
                  value={row.role}
                  onValueChange={(value) =>
                    step.updateRow(row.id, { role: value as OrganizationMemberRole })
                  }
                  options={SIGNUP_INVITE_ROLE_OPTIONS}
                  showAvatars={false}
                  disabled={step.loading}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={SIGNUP_INVITE_ADD_BUTTON_CLASS}
        onClick={step.addRow}
        disabled={step.loading}
      >
        {SIGNUP_INVITE_ADD_PERSON_LABEL}
      </button>

      <button
        type="button"
        disabled={step.loading}
        aria-busy={step.loading}
        className={LOGIN_FORM_SUBMIT_CLASS}
        onClick={() => void step.sendInvites()}
      >
        <span className={LOGIN_FORM_SUBMIT_INNER_CLASS}>
          {step.loading ? SIGNUP_INVITE_NEXT_LOADING_LABEL : SIGNUP_INVITE_NEXT_LABEL}
        </span>
      </button>

      <button
        type="button"
        className={SIGNUP_INVITE_SKIP_BUTTON_CLASS}
        onClick={onSkip}
        disabled={step.loading}
      >
        {SIGNUP_INVITE_SKIP_LABEL}
      </button>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{SIGNUP_INVITE_SKIP_BLURB}</p>
    </div>
  );
}
