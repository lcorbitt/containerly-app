"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { TextInput } from "@/components/TextInput";
import {
  LOGIN_FORM_BLURRED_CONTENT_CLASS,
  LOGIN_FORM_FIELD_GROUP_CLASS,
  LOGIN_FORM_FIELD_ICON_CLASS,
  LOGIN_FORM_FIELDS_CLASS,
  LOGIN_FORM_FOOTER_CLASS,
  LOGIN_FORM_FOOTER_LINK_CLASS,
  LOGIN_FORM_FORGOT_PASSWORD_LABEL,
  LOGIN_FORM_FORGOT_PASSWORD_LINK_CLASS,
  LOGIN_FORM_INPUT_CLASS,
  LOGIN_FORM_LOADING_CARD_CLASS,
  LOGIN_FORM_LOADING_OVERLAY_CLASS,
  LOGIN_FORM_MESSAGE_CLASS,
  LOGIN_FORM_PASSWORD_TOGGLE_CLASS,
  LOGIN_FORM_SHELL_CLASS,
  LOGIN_FORM_SUBMIT_CLASS,
  LOGIN_FORM_SUBMIT_INNER_CLASS,
  LOGIN_FORM_TITLE_CLASS,
} from "./constants";
import type { LoginFormProps } from "./types";

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  mode,
  message,
  loading,
  loadingTitle,
  loadingSubtitle,
  submit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === "signup";

  return (
    <div className={LOGIN_FORM_SHELL_CLASS}>
      <div className={loading ? LOGIN_FORM_BLURRED_CONTENT_CLASS : ""}>
        <h1 className={LOGIN_FORM_TITLE_CLASS}>{isSignUp ? "Sign Up" : "Sign In"}</h1>

        <form onSubmit={submit} className={LOGIN_FORM_FIELDS_CLASS} aria-busy={loading}>
          {isSignUp ? (
            <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
              <User className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
              <TextInput
                type="text"
                autoComplete="name"
                clearable={false}
                className={LOGIN_FORM_INPUT_CLASS}
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          ) : null}

          <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
            <Mail className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <TextInput
              type="email"
              autoComplete="email"
              clearable={false}
              className={LOGIN_FORM_INPUT_CLASS}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={LOGIN_FORM_FIELD_GROUP_CLASS}>
            <Lock className={LOGIN_FORM_FIELD_ICON_CLASS} strokeWidth={1.75} aria-hidden />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className={`${LOGIN_FORM_INPUT_CLASS} pr-10`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              className={LOGIN_FORM_PASSWORD_TOGGLE_CLASS}
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

          {!isSignUp ? (
            <p className="-mt-1 text-right">
              <Link href="/forgot-password" className={LOGIN_FORM_FORGOT_PASSWORD_LINK_CLASS}>
                {LOGIN_FORM_FORGOT_PASSWORD_LABEL}
              </Link>
            </p>
          ) : null}

          {message ? (
            <p className={LOGIN_FORM_MESSAGE_CLASS} role="alert">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={LOGIN_FORM_SUBMIT_CLASS}
          >
            <span className={LOGIN_FORM_SUBMIT_INNER_CLASS}>
              {isSignUp ? "Create account" : "Continue"}
            </span>
          </button>
        </form>

        <p className={LOGIN_FORM_FOOTER_CLASS}>
          <Link href="/" className={LOGIN_FORM_FOOTER_LINK_CLASS}>
            Back home
          </Link>
        </p>
      </div>

      {loading ? (
        <div
          className={LOGIN_FORM_LOADING_OVERLAY_CLASS}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={LOGIN_FORM_LOADING_CARD_CLASS}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{loadingTitle}</p>
              {loadingSubtitle ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{loadingSubtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
