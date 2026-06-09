"use client";

import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { TextInput } from "@/components/TextInput";
import {
  FORGOT_PASSWORD_FORM_BLURRED_CONTENT_CLASS,
  FORGOT_PASSWORD_FORM_FIELD_GROUP_CLASS,
  FORGOT_PASSWORD_FORM_FIELD_ICON_CLASS,
  FORGOT_PASSWORD_FORM_FIELDS_CLASS,
  FORGOT_PASSWORD_FORM_FOOTER_CLASS,
  FORGOT_PASSWORD_FORM_FOOTER_LINK_CLASS,
  FORGOT_PASSWORD_FORM_INPUT_CLASS,
  FORGOT_PASSWORD_FORM_LOADING_CARD_CLASS,
  FORGOT_PASSWORD_FORM_LOADING_OVERLAY_CLASS,
  FORGOT_PASSWORD_FORM_LOADING_TITLE,
  FORGOT_PASSWORD_FORM_MESSAGE_CLASS,
  FORGOT_PASSWORD_FORM_SHELL_CLASS,
  FORGOT_PASSWORD_FORM_SUBMIT_CLASS,
  FORGOT_PASSWORD_FORM_SUBMIT_INNER_CLASS,
  FORGOT_PASSWORD_FORM_SUBMIT_LABEL,
  FORGOT_PASSWORD_FORM_TITLE,
  FORGOT_PASSWORD_FORM_TITLE_CLASS,
} from "./constants";
import type { ForgotPasswordFormProps } from "./types";

export function ForgotPasswordForm({
  email,
  setEmail,
  message,
  submitted,
  loading,
  submit,
}: ForgotPasswordFormProps) {
  return (
    <div className={FORGOT_PASSWORD_FORM_SHELL_CLASS}>
      <div className={loading ? FORGOT_PASSWORD_FORM_BLURRED_CONTENT_CLASS : ""}>
        <h1 className={FORGOT_PASSWORD_FORM_TITLE_CLASS}>{FORGOT_PASSWORD_FORM_TITLE}</h1>

        <form onSubmit={submit} className={FORGOT_PASSWORD_FORM_FIELDS_CLASS} aria-busy={loading}>
          <div className={FORGOT_PASSWORD_FORM_FIELD_GROUP_CLASS}>
            <Mail className={FORGOT_PASSWORD_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <TextInput
              type="email"
              autoComplete="email"
              clearable={false}
              className={FORGOT_PASSWORD_FORM_INPUT_CLASS}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || submitted}
            />
          </div>

          {message ? (
            <p className={FORGOT_PASSWORD_FORM_MESSAGE_CLASS} role="status">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || submitted}
            aria-busy={loading}
            className={FORGOT_PASSWORD_FORM_SUBMIT_CLASS}
          >
            <span className={FORGOT_PASSWORD_FORM_SUBMIT_INNER_CLASS}>
              {FORGOT_PASSWORD_FORM_SUBMIT_LABEL}
            </span>
          </button>
        </form>

        <p className={FORGOT_PASSWORD_FORM_FOOTER_CLASS}>
          <Link href="/login" className={FORGOT_PASSWORD_FORM_FOOTER_LINK_CLASS}>
            Sign In
          </Link>
        </p>
      </div>

      {loading ? (
        <div
          className={FORGOT_PASSWORD_FORM_LOADING_OVERLAY_CLASS}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={FORGOT_PASSWORD_FORM_LOADING_CARD_CLASS}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {FORGOT_PASSWORD_FORM_LOADING_TITLE}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
