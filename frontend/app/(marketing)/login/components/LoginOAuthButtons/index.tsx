"use client";

import { Loader2 } from "lucide-react";
import {
  LOGIN_FORM_BLURRED_CONTENT_CLASS,
  LOGIN_FORM_LOADING_CARD_CLASS,
  LOGIN_FORM_LOADING_OVERLAY_CLASS,
  LOGIN_FORM_MESSAGE_CLASS,
} from "../LoginForm/constants";
import {
  LOGIN_OAUTH_BUTTON_CLASS,
  LOGIN_OAUTH_BUTTONS_CLASS,
  LOGIN_OAUTH_DIVIDER_CLASS,
  LOGIN_OAUTH_DIVIDER_LABEL,
  LOGIN_OAUTH_DIVIDER_LABEL_CLASS,
  LOGIN_OAUTH_DIVIDER_LINE_CLASS,
  LOGIN_OAUTH_GOOGLE_LABEL,
  LOGIN_OAUTH_LOADING_SUBTITLE,
  LOGIN_OAUTH_LOADING_TITLE,
  LOGIN_OAUTH_MICROSOFT_LABEL,
} from "./constants";
import type { LoginOAuthButtonsProps } from "./types";
import { useLoginOAuthButtons } from "./useLoginOAuthButtons";

export function LoginOAuthButtons({ next, disabled = false, initialError = null }: LoginOAuthButtonsProps) {
  const oauth = useLoginOAuthButtons({ next, initialError });
  const isBusy = disabled || oauth.loading;

  return (
    <div className="relative w-full">
      <div className={isBusy ? LOGIN_FORM_BLURRED_CONTENT_CLASS : ""}>
        <div className={LOGIN_OAUTH_BUTTONS_CLASS}>
          <button
            type="button"
            disabled={isBusy}
            className={LOGIN_OAUTH_BUTTON_CLASS}
            onClick={oauth.signInWithGoogle}
          >
            {LOGIN_OAUTH_GOOGLE_LABEL}
          </button>
          <button
            type="button"
            disabled={isBusy}
            className={LOGIN_OAUTH_BUTTON_CLASS}
            onClick={oauth.signInWithMicrosoft}
          >
            {LOGIN_OAUTH_MICROSOFT_LABEL}
          </button>
        </div>

        {oauth.message ? (
          <p className={`${LOGIN_FORM_MESSAGE_CLASS} mt-3`} role="alert">
            {oauth.message}
          </p>
        ) : null}

        <div className={LOGIN_OAUTH_DIVIDER_CLASS} aria-hidden={false}>
          <span className={LOGIN_OAUTH_DIVIDER_LINE_CLASS} />
          <span className={LOGIN_OAUTH_DIVIDER_LABEL_CLASS}>{LOGIN_OAUTH_DIVIDER_LABEL}</span>
          <span className={LOGIN_OAUTH_DIVIDER_LINE_CLASS} />
        </div>
      </div>

      {oauth.loading ? (
        <div
          className={LOGIN_FORM_LOADING_OVERLAY_CLASS}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={LOGIN_FORM_LOADING_CARD_CLASS}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {LOGIN_OAUTH_LOADING_TITLE}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {LOGIN_OAUTH_LOADING_SUBTITLE}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
