"use client";

import {
  LOGIN_FORM_FIELDS_CLASS,
  LOGIN_FORM_SUBMIT_CLASS,
  LOGIN_FORM_SUBMIT_INNER_CLASS,
} from "@/app/(marketing)/login/components/LoginForm/constants";
import {
  SIGNUP_ORG_FIELD_LABEL_CLASS,
  SIGNUP_ORG_SELECT_CLASS,
  SIGNUP_ORG_SHIPMENT_VOLUME_LABEL,
  SIGNUP_ORG_SHIPMENT_VOLUME_OPTIONS,
  SIGNUP_ORG_SUBMIT_LABEL,
  SIGNUP_ORG_TEAM_NAME_LABEL,
  SIGNUP_ORG_TEAM_SIZE_LABEL,
  SIGNUP_ORG_TEAM_SIZE_OPTIONS,
  SIGNUP_ORG_TEXT_INPUT_CLASS,
} from "./constants";
import type { SignupOrganizationStepProps } from "./types";
import { useSignupOrganizationStep } from "./useSignupOrganizationStep";

export function SignupOrganizationStep({ pendingInvite, onComplete }: SignupOrganizationStepProps) {
  const step = useSignupOrganizationStep({ pendingInvite, onComplete });

  return (
    <form onSubmit={step.submit} className={`${LOGIN_FORM_FIELDS_CLASS} mt-6`} aria-busy={step.loading}>
      <div>
        <label className={SIGNUP_ORG_FIELD_LABEL_CLASS} htmlFor="signup-team-name">
          {SIGNUP_ORG_TEAM_NAME_LABEL}
        </label>
        <input
          id="signup-team-name"
          type="text"
          autoComplete="organization"
          className={SIGNUP_ORG_TEXT_INPUT_CLASS}
          placeholder="Acme Logistics"
          value={step.name}
          onChange={(e) => step.setName(e.target.value)}
          required
          disabled={step.loading}
        />
      </div>

      <div>
        <label className={SIGNUP_ORG_FIELD_LABEL_CLASS} htmlFor="signup-team-size">
          {SIGNUP_ORG_TEAM_SIZE_LABEL}
        </label>
        <select
          id="signup-team-size"
          value={step.teamSize}
          onChange={(e) => step.setTeamSize(e.target.value)}
          className={SIGNUP_ORG_SELECT_CLASS}
          required
          disabled={step.loading}
        >
          {SIGNUP_ORG_TEAM_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={SIGNUP_ORG_FIELD_LABEL_CLASS} htmlFor="signup-shipment-volume">
          {SIGNUP_ORG_SHIPMENT_VOLUME_LABEL}
        </label>
        <select
          id="signup-shipment-volume"
          value={step.monthlyShipmentVolume}
          onChange={(e) => step.setMonthlyShipmentVolume(e.target.value)}
          className={SIGNUP_ORG_SELECT_CLASS}
          required
          disabled={step.loading}
        >
          {SIGNUP_ORG_SHIPMENT_VOLUME_OPTIONS.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={step.loading}
        aria-busy={step.loading}
        className={LOGIN_FORM_SUBMIT_CLASS}
      >
        <span className={LOGIN_FORM_SUBMIT_INNER_CLASS}>
          {step.loading ? "Creating…" : SIGNUP_ORG_SUBMIT_LABEL}
        </span>
      </button>
    </form>
  );
}
