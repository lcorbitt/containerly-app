"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import {
  SET_PASSWORD_FORM_BLURRED_CONTENT_CLASS,
  SET_PASSWORD_FORM_FIELD_GROUP_CLASS,
  SET_PASSWORD_FORM_FIELD_ICON_CLASS,
  SET_PASSWORD_FORM_FIELDS_CLASS,
  SET_PASSWORD_FORM_FOOTER_CLASS,
  SET_PASSWORD_FORM_FOOTER_LINK_CLASS,
  SET_PASSWORD_FORM_INPUT_CLASS,
  SET_PASSWORD_FORM_LOADING_CARD_CLASS,
  SET_PASSWORD_FORM_LOADING_OVERLAY_CLASS,
  SET_PASSWORD_FORM_LOADING_TITLE,
  SET_PASSWORD_FORM_MESSAGE_CLASS,
  SET_PASSWORD_FORM_NEEDS_AUTH_MESSAGE,
  SET_PASSWORD_FORM_PASSWORD_TOGGLE_CLASS,
  SET_PASSWORD_FORM_SHELL_CLASS,
  SET_PASSWORD_FORM_SUBMIT_CLASS,
  SET_PASSWORD_FORM_SUBMIT_INNER_CLASS,
  SET_PASSWORD_FORM_SUBMIT_INVITE,
  SET_PASSWORD_FORM_SUBMIT_RECOVERY,
  SET_PASSWORD_FORM_TITLE_CLASS,
  SET_PASSWORD_FORM_TITLE_INVITE,
  SET_PASSWORD_FORM_TITLE_RECOVERY,
  SET_PASSWORD_MIN_LENGTH,
} from "./constants";
import type { SetPasswordFormProps } from "./types";

export function SetPasswordForm({
  flow,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  message,
  loading,
  needsAuth,
  submit,
}: SetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isRecovery = flow === "recovery";
  const title = isRecovery ? SET_PASSWORD_FORM_TITLE_RECOVERY : SET_PASSWORD_FORM_TITLE_INVITE;
  const submitLabel = isRecovery ? SET_PASSWORD_FORM_SUBMIT_RECOVERY : SET_PASSWORD_FORM_SUBMIT_INVITE;

  if (needsAuth) {
    return (
      <div className={SET_PASSWORD_FORM_SHELL_CLASS}>
        <h1 className={SET_PASSWORD_FORM_TITLE_CLASS}>{title}</h1>
        <p className={`${SET_PASSWORD_FORM_MESSAGE_CLASS} mt-4`} role="alert">
          {SET_PASSWORD_FORM_NEEDS_AUTH_MESSAGE}
        </p>
        <p className={SET_PASSWORD_FORM_FOOTER_CLASS}>
          <Link href="/login" className={SET_PASSWORD_FORM_FOOTER_LINK_CLASS}>
            Sign In
          </Link>
          {" · "}
          <Link href="/forgot-password" className={SET_PASSWORD_FORM_FOOTER_LINK_CLASS}>
            Forgot Password
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={SET_PASSWORD_FORM_SHELL_CLASS}>
      <div className={loading ? SET_PASSWORD_FORM_BLURRED_CONTENT_CLASS : ""}>
        <h1 className={SET_PASSWORD_FORM_TITLE_CLASS}>{title}</h1>

        <form onSubmit={submit} className={SET_PASSWORD_FORM_FIELDS_CLASS} aria-busy={loading}>
          <div className={SET_PASSWORD_FORM_FIELD_GROUP_CLASS}>
            <Lock className={SET_PASSWORD_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${SET_PASSWORD_FORM_INPUT_CLASS} pr-10`}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={SET_PASSWORD_MIN_LENGTH}
              disabled={loading}
            />
            <button
              type="button"
              className={SET_PASSWORD_FORM_PASSWORD_TOGGLE_CLASS}
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>

          <div className={SET_PASSWORD_FORM_FIELD_GROUP_CLASS}>
            <Lock className={SET_PASSWORD_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className={`${SET_PASSWORD_FORM_INPUT_CLASS} pr-10`}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={SET_PASSWORD_MIN_LENGTH}
              disabled={loading}
            />
            <button
              type="button"
              className={SET_PASSWORD_FORM_PASSWORD_TOGGLE_CLASS}
              onClick={() => setShowConfirm((visible) => !visible)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              disabled={loading}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>

          {message ? (
            <p className={SET_PASSWORD_FORM_MESSAGE_CLASS} role="alert">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={SET_PASSWORD_FORM_SUBMIT_CLASS}
          >
            <span className={SET_PASSWORD_FORM_SUBMIT_INNER_CLASS}>{submitLabel}</span>
          </button>
        </form>

        <p className={SET_PASSWORD_FORM_FOOTER_CLASS}>
          <Link href="/login" className={SET_PASSWORD_FORM_FOOTER_LINK_CLASS}>
            Sign In
          </Link>
        </p>
      </div>

      {loading ? (
        <div
          className={SET_PASSWORD_FORM_LOADING_OVERLAY_CLASS}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={SET_PASSWORD_FORM_LOADING_CARD_CLASS}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {SET_PASSWORD_FORM_LOADING_TITLE}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
