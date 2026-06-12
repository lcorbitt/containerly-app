"use client";

import {
  LOGIN_FORM_FIELDS_CLASS,
  LOGIN_FORM_SUBMIT_CLASS,
  LOGIN_FORM_SUBMIT_INNER_CLASS,
} from "@/app/(marketing)/login/components/LoginForm/constants";
import type { OrganizationMemberRole } from "@/types/database";
import {
  SIGNUP_INVITE_ADD_BUTTON_CLASS,
  SIGNUP_INVITE_ADD_PERSON_LABEL,
  SIGNUP_INVITE_EMAIL_LABEL,
  SIGNUP_INVITE_FIELD_LABEL_CLASS,
  SIGNUP_INVITE_INPUT_CLASS,
  SIGNUP_INVITE_ROLE_LABEL,
  SIGNUP_INVITE_ROLE_OPTIONS,
  SIGNUP_INVITE_SELECT_CLASS,
  SIGNUP_INVITE_NEXT_LABEL,
  SIGNUP_INVITE_NEXT_LOADING_LABEL,
  SIGNUP_INVITE_SKIP_BLURB,
  SIGNUP_INVITE_SKIP_BUTTON_CLASS,
  SIGNUP_INVITE_SKIP_LABEL,
} from "./constants";
import type { SignupInviteTeamStepProps } from "./types";
import { useSignupInviteTeamStep } from "./useSignupInviteTeamStep";

export function SignupInviteTeamStep({
  organizationId,
  onSkip,
  onComplete,
}: SignupInviteTeamStepProps) {
  const step = useSignupInviteTeamStep({ organizationId, onComplete });

  return (
    <div className="mt-6 space-y-4">
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
              <label className={SIGNUP_INVITE_FIELD_LABEL_CLASS} htmlFor={`invite-role-${row.id}`}>
                {SIGNUP_INVITE_ROLE_LABEL}
              </label>
              <select
                id={`invite-role-${row.id}`}
                value={row.role}
                onChange={(e) =>
                  step.updateRow(row.id, { role: e.target.value as OrganizationMemberRole })
                }
                className={SIGNUP_INVITE_SELECT_CLASS}
                disabled={step.loading}
              >
                {SIGNUP_INVITE_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
