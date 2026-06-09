"use client";

import { SetPasswordForm } from "../SetPasswordForm";
import { useSetPasswordForm } from "../SetPasswordForm/useSetPasswordForm";
import {
  SET_PASSWORD_PAGE_BACKGROUND_CLASS,
  SET_PASSWORD_PAGE_CLASS,
  SET_PASSWORD_PAGE_INNER_CLASS,
} from "./constants";
import type { SetPasswordPageProps } from "./types";

export function SetPasswordPage({ initialFlow }: SetPasswordPageProps) {
  const form = useSetPasswordForm({ initialFlow });

  return (
    <div className={SET_PASSWORD_PAGE_CLASS}>
      <div className={SET_PASSWORD_PAGE_BACKGROUND_CLASS} aria-hidden>
        <div className="landing-grid-bg absolute inset-0" />
        <div className="landing-hero-glow opacity-60" />
      </div>

      <div className={SET_PASSWORD_PAGE_INNER_CLASS}>
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <SetPasswordForm
            flow={form.flow}
            password={form.password}
            setPassword={form.setPassword}
            confirmPassword={form.confirmPassword}
            setConfirmPassword={form.setConfirmPassword}
            message={form.message}
            loading={form.loading}
            needsAuth={form.needsAuth}
            submit={form.submit}
          />
        </div>
      </div>
    </div>
  );
}
