"use client";

import { ForgotPasswordForm } from "../ForgotPasswordForm";
import { useForgotPasswordForm } from "../ForgotPasswordForm/useForgotPasswordForm";
import {
  FORGOT_PASSWORD_PAGE_BACKGROUND_CLASS,
  FORGOT_PASSWORD_PAGE_CLASS,
  FORGOT_PASSWORD_PAGE_INNER_CLASS,
} from "./constants";

export function ForgotPasswordPage() {
  const form = useForgotPasswordForm();

  return (
    <div className={FORGOT_PASSWORD_PAGE_CLASS}>
      <div className={FORGOT_PASSWORD_PAGE_BACKGROUND_CLASS} aria-hidden>
        <div className="landing-grid-bg absolute inset-0" />
        <div className="landing-hero-glow opacity-60" />
      </div>

      <div className={FORGOT_PASSWORD_PAGE_INNER_CLASS}>
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <ForgotPasswordForm
            email={form.email}
            setEmail={form.setEmail}
            message={form.message}
            submitted={form.submitted}
            loading={form.loading}
            submit={form.submit}
          />
        </div>
      </div>
    </div>
  );
}
