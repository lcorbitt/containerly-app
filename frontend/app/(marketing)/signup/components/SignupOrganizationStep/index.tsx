"use client";

import { OrganizationImageSettings } from "@/components/OrganizationImageSettings";
import {
  LOGIN_FORM_FIELDS_CLASS,
  LOGIN_FORM_SUBMIT_CLASS,
  LOGIN_FORM_SUBMIT_INNER_CLASS,
} from "@/app/(marketing)/login/components/LoginForm/constants";
import {
  SIGNUP_ORG_FIELD_LABEL_CLASS,
  SIGNUP_ORG_IMAGE_SECTION_CLASS,
  SIGNUP_ORG_SELECT_CLASS,
  SIGNUP_ORG_SHIPMENT_VOLUME_LABEL,
  SIGNUP_ORG_SHIPMENT_VOLUME_OPTIONS,
  SIGNUP_ORG_SUBMIT_LABEL,
  SIGNUP_ORG_SUBMIT_LOADING_LABEL,
  SIGNUP_ORG_TEAM_NAME_LABEL,
  SIGNUP_ORG_TEAM_SIZE_LABEL,
  SIGNUP_ORG_TEAM_SIZE_OPTIONS,
  SIGNUP_ORG_TEXT_INPUT_CLASS,
} from "./constants";
import { SignupWizardBackButton } from "../SignupWizard/SignupWizardBackButton";
import type { SignupOrganizationStepProps } from "./types";
import { useSignupOrganizationStep } from "./useSignupOrganizationStep";

export function SignupOrganizationStep({
  pendingInvite,
  organizationId,
  onOrganizationIdReady,
  onComplete,
  onBack,
}: SignupOrganizationStepProps) {
  const step = useSignupOrganizationStep({
    pendingInvite,
    organizationId,
    onOrganizationIdReady,
    onComplete,
  });

  return (
    <form onSubmit={step.submit} className={`${LOGIN_FORM_FIELDS_CLASS} mt-6`} aria-busy={step.loading}>
      <SignupWizardBackButton onClick={onBack} disabled={step.loading} />

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
          disabled={step.loading || step.fieldsLocked}
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
          disabled={step.loading || step.fieldsLocked}
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
          disabled={step.loading || step.fieldsLocked}
        >
          {SIGNUP_ORG_SHIPMENT_VOLUME_OPTIONS.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {step.activeOrganizationId ? (
        <div className={SIGNUP_ORG_IMAGE_SECTION_CLASS}>
          <OrganizationImageSettings
            key={step.activeOrganizationId}
            organizationId={step.activeOrganizationId}
            organizationName={step.name}
            initialOrgImagePath={step.orgImagePath}
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={step.loading}
        aria-busy={step.loading}
        className={LOGIN_FORM_SUBMIT_CLASS}
      >
        <span className={LOGIN_FORM_SUBMIT_INNER_CLASS}>
          {step.loading ? SIGNUP_ORG_SUBMIT_LOADING_LABEL : SIGNUP_ORG_SUBMIT_LABEL}
        </span>
      </button>
    </form>
  );
}
