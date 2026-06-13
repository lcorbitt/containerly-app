"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { LoginOAuthButtons } from "@/app/(marketing)/login/components/LoginOAuthButtons";
import {
  LOGIN_AUTH_PANEL_MODE_SWITCH_BUTTON_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_PROMPT_CLASS,
} from "@/app/(marketing)/login/components/LoginAuthPanel/constants";
import { TextInput } from "@/components/TextInput";
import {
  LOGIN_FORM_FIELD_GROUP_CLASS,
  LOGIN_FORM_FIELD_ICON_CLASS,
  LOGIN_FORM_FIELDS_CLASS,
  LOGIN_FORM_FOOTER_CLASS,
  LOGIN_FORM_FOOTER_LINK_CLASS,
  LOGIN_FORM_INPUT_CLASS,
  LOGIN_FORM_MESSAGE_CLASS,
  LOGIN_FORM_PASSWORD_TOGGLE_CLASS,
  LOGIN_FORM_SHELL_CLASS,
  LOGIN_FORM_SUBMIT_CLASS,
  LOGIN_FORM_SUBMIT_INNER_CLASS,
} from "@/app/(marketing)/login/components/LoginForm/constants";
import {
  SIGNUP_ACCOUNT_FIELD_LABEL_CLASS,
  SIGNUP_ACCOUNT_REFERRAL_OPTIONS,
  SIGNUP_ACCOUNT_REFERRAL_OTHER_LABEL,
  SIGNUP_ACCOUNT_SELECT_CLASS,
  SIGNUP_ACCOUNT_SIGN_IN_LABEL,
  SIGNUP_ACCOUNT_SIGN_IN_PROMPT,
  SIGNUP_ACCOUNT_SUBMIT_LABEL,
} from "./constants";
import { SignupWizardBackButton } from "../SignupWizard/SignupWizardBackButton";
import type { SignupAccountStepProps } from "./types";
import { useSignupAccountStep } from "./useSignupAccountStep";

const OAUTH_NEXT = "/signup?step=2";

export function SignupAccountStep({
  onContinue,
  onBack,
  initialError = null,
}: SignupAccountStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const step = useSignupAccountStep({ onContinue });

  return (
    <div className={`${LOGIN_FORM_SHELL_CLASS} mt-6`}>
      <form onSubmit={step.submit} className={LOGIN_FORM_FIELDS_CLASS}>
        <SignupWizardBackButton onClick={onBack} />

          <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
            <User className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <TextInput
              type="text"
              autoComplete="name"
              clearable={false}
              className={LOGIN_FORM_INPUT_CLASS}
              placeholder="Full Name"
              value={step.fullName}
              onChange={(e) => step.setFullName(e.target.value)}
              required
            />
          </div>

          <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
            <Mail className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <TextInput
              type="email"
              autoComplete="email"
              clearable={false}
              className={LOGIN_FORM_INPUT_CLASS}
              placeholder="Email Address"
              value={step.email}
              onChange={(e) => step.setEmail(e.target.value)}
              required
            />
          </div>

          <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
            <Lock className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${LOGIN_FORM_INPUT_CLASS} pr-10`}
              placeholder="Password"
              value={step.password}
              onChange={(e) => step.setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className={LOGIN_FORM_PASSWORD_TOGGLE_CLASS}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>

          <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
            <Lock className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${LOGIN_FORM_INPUT_CLASS} pr-10`}
              placeholder="Confirm Password"
              value={step.confirmPassword}
              onChange={(e) => step.setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className={LOGIN_FORM_PASSWORD_TOGGLE_CLASS}
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>

          <div>
            <label className={SIGNUP_ACCOUNT_FIELD_LABEL_CLASS} htmlFor="signup-referral">
              How Did You Hear About Us?
            </label>
            <select
              id="signup-referral"
              value={step.referralOption}
              onChange={(e) => step.setReferralOption(e.target.value)}
              className={SIGNUP_ACCOUNT_SELECT_CLASS}
            >
              {SIGNUP_ACCOUNT_REFERRAL_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {step.referralOption === "other" ? (
            <div>
              <label className={SIGNUP_ACCOUNT_FIELD_LABEL_CLASS} htmlFor="signup-referral-other">
                {SIGNUP_ACCOUNT_REFERRAL_OTHER_LABEL}
              </label>
              <TextInput
                id="signup-referral-other"
                type="text"
                clearable={false}
                className={`${LOGIN_FORM_INPUT_CLASS} pl-4`}
                placeholder="Tell us how you found us"
                value={step.referralOther}
                onChange={(e) => step.setReferralOther(e.target.value)}
              />
            </div>
          ) : null}

          {step.message ? (
            <p className={LOGIN_FORM_MESSAGE_CLASS} role="alert">
              {step.message}
            </p>
          ) : null}

          <button type="submit" className={LOGIN_FORM_SUBMIT_CLASS}>
            <span className={LOGIN_FORM_SUBMIT_INNER_CLASS}>{SIGNUP_ACCOUNT_SUBMIT_LABEL}</span>
          </button>
        </form>

        <LoginOAuthButtons next={OAUTH_NEXT} initialError={initialError} />

        <div className={LOGIN_AUTH_PANEL_MODE_SWITCH_CLASS}>
          <span className={LOGIN_AUTH_PANEL_MODE_SWITCH_PROMPT_CLASS}>
            {SIGNUP_ACCOUNT_SIGN_IN_PROMPT}
          </span>
          <Link href="/login" className={LOGIN_AUTH_PANEL_MODE_SWITCH_BUTTON_CLASS}>
            {SIGNUP_ACCOUNT_SIGN_IN_LABEL}
          </Link>
        </div>

        <p className={LOGIN_FORM_FOOTER_CLASS}>
          <Link href="/" className={LOGIN_FORM_FOOTER_LINK_CLASS}>
            Back Home
          </Link>
        </p>
    </div>
  );
}
