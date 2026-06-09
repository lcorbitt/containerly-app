"use client";

import {
  PASSWORD_SETTINGS_CONFIRM_LABEL,
  PASSWORD_SETTINGS_CURRENT_LABEL,
  PASSWORD_SETTINGS_MIN_LENGTH,
  PASSWORD_SETTINGS_NEW_LABEL,
  PASSWORD_SETTINGS_SECTION_TITLE,
  PASSWORD_SETTINGS_SUBMIT_LABEL,
} from "./constants";
import { usePasswordSettingsPanel } from "./usePasswordSettingsPanel";

export function PasswordSettingsPanel() {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    saving,
    save,
  } = usePasswordSettingsPanel();

  return (
    <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {PASSWORD_SETTINGS_SECTION_TITLE}
      </h3>
      <div className="mt-4 grid max-w-md gap-3">
        <div>
          <label
            htmlFor="settings-current-password"
            className="text-zinc-500 dark:text-zinc-500"
          >
            {PASSWORD_SETTINGS_CURRENT_LABEL}
          </label>
          <input
            id="settings-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={saving}
            className="mt-0.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="settings-new-password" className="text-zinc-500 dark:text-zinc-500">
            {PASSWORD_SETTINGS_NEW_LABEL}
          </label>
          <input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={saving}
            minLength={PASSWORD_SETTINGS_MIN_LENGTH}
            className="mt-0.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div>
          <label
            htmlFor="settings-confirm-password"
            className="text-zinc-500 dark:text-zinc-500"
          >
            {PASSWORD_SETTINGS_CONFIRM_LABEL}
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={saving}
            minLength={PASSWORD_SETTINGS_MIN_LENGTH}
            className="mt-0.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Updating…" : PASSWORD_SETTINGS_SUBMIT_LABEL}
        </button>
      </div>
    </div>
  );
}
