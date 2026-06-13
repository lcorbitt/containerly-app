"use client";

import Link from "next/link";
import { LoginForm } from "../LoginForm";
import { LoginOAuthButtons } from "../LoginOAuthButtons";
import { useLoginForm } from "../LoginForm/useLoginForm";
import {
  LOGIN_AUTH_PANEL_CARD_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_BUTTON_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_PROMPT_CLASS,
} from "./constants";
import type { LoginAuthPanelProps } from "./types";

export function LoginAuthPanel({ next, initialError = null }: LoginAuthPanelProps) {
  const form = useLoginForm({ next });

  return (
    <div className={LOGIN_AUTH_PANEL_CARD_CLASS}>
      <LoginForm
        email={form.email}
        setEmail={form.setEmail}
        password={form.password}
        setPassword={form.setPassword}
        message={form.message}
        loading={form.loading}
        loadingTitle={form.loadingTitle}
        submit={form.submit}
      />

      <LoginOAuthButtons next={next} disabled={form.loading} initialError={initialError} />

      <div className={LOGIN_AUTH_PANEL_MODE_SWITCH_CLASS}>
        <span className={LOGIN_AUTH_PANEL_MODE_SWITCH_PROMPT_CLASS}>
          Don&apos;t have an account?
        </span>
        <Link href="/signup" className={LOGIN_AUTH_PANEL_MODE_SWITCH_BUTTON_CLASS}>
          Sign Up
        </Link>
      </div>
    </div>
  );
}
