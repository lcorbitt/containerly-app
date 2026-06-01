"use client";

import {
  CREATE_ORG_FORM_TITLE,
  CREATE_ORG_INPUT_CLASS,
  CREATE_ORG_SUBMIT_BUTTON_CLASS,
  CREATE_ORG_SUBMIT_LABEL,
  CREATE_ORG_SUBMIT_LOADING_LABEL,
} from "./constants";
import { useCreateOrgForm } from "./hooks/useCreateOrgForm";

export function CreateOrgForm({ onCreated }: { onCreated: (orgId: string) => Promise<void> | void }) {
  const f = useCreateOrgForm(onCreated);

  return (
    <form
      onSubmit={(e) => void f.submit(e)}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      aria-busy={f.loading}
    >
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{CREATE_ORG_FORM_TITLE}</h2>
      <input
        className={CREATE_ORG_INPUT_CLASS}
        placeholder="Company name"
        value={f.name}
        onChange={(e) => f.setName(e.target.value)}
        required
        disabled={f.loading}
        autoComplete="organization"
      />
      <input
        className={CREATE_ORG_INPUT_CLASS}
        placeholder="Slug (optional)"
        value={f.slug}
        onChange={(e) => f.setSlug(e.target.value)}
        disabled={f.loading}
        autoComplete="off"
      />
      {f.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {f.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={f.loading}
        aria-busy={f.loading}
        className={CREATE_ORG_SUBMIT_BUTTON_CLASS}
      >
        {f.loading ? (
          <>
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span>{CREATE_ORG_SUBMIT_LOADING_LABEL}</span>
          </>
        ) : (
          CREATE_ORG_SUBMIT_LABEL
        )}
      </button>
    </form>
  );
}
