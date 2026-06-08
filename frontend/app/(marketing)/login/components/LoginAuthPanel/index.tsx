"use client";

import { LoginForm } from "../LoginForm";
import { useLoginForm } from "../LoginForm/useLoginForm";
import {
  LOGIN_AUTH_PANEL_CARD_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_BUTTON_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_CLASS,
  LOGIN_AUTH_PANEL_MODE_SWITCH_PROMPT_CLASS,
} from "./constants";
import type { LoginAuthPanelProps } from "./types";

export function LoginAuthPanel({ initialMode, next }: LoginAuthPanelProps) {
  const form = useLoginForm({ initialMode, next });
  const isSignUp = form.mode === "signup";

  return (
    <div className={LOGIN_AUTH_PANEL_CARD_CLASS}>
      <LoginForm
        email={form.email}
        setEmail={form.setEmail}
        password={form.password}
        setPassword={form.setPassword}
        fullName={form.fullName}
        setFullName={form.setFullName}
        mode={form.mode}
        message={form.message}
        loading={form.loading}
        loadingTitle={form.loadingTitle}
        loadingSubtitle={form.loadingSubtitle}
        submit={form.submit}
      />

      <div className={LOGIN_AUTH_PANEL_MODE_SWITCH_CLASS}>
        <span className={LOGIN_AUTH_PANEL_MODE_SWITCH_PROMPT_CLASS}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </span>
        <button
          type="button"
          disabled={form.loading}
          className={`disabled:opacity-50 ${LOGIN_AUTH_PANEL_MODE_SWITCH_BUTTON_CLASS}`}
          onClick={() => form.setMode(isSignUp ? "signin" : "signup")}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
}
