"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  CREATE_ORG_ONBOARDING_ALREADY_MEMBER_MESSAGE,
  CREATE_ORG_ONBOARDING_DESCRIPTION,
  CREATE_ORG_ONBOARDING_INPUT_CLASS,
  CREATE_ORG_ONBOARDING_LOADING_LABEL,
  CREATE_ORG_ONBOARDING_NAME_LABEL,
  CREATE_ORG_ONBOARDING_NO_INVITE_MESSAGE,
  CREATE_ORG_ONBOARDING_SLUG_LABEL,
  CREATE_ORG_ONBOARDING_SUBMIT_CLASS,
  CREATE_ORG_ONBOARDING_SUBMIT_LABEL,
  CREATE_ORG_ONBOARDING_TITLE,
} from "./constants";
import { useCreateOrganizationOnboardingForm } from "./useCreateOrganizationOnboardingForm";

export function CreateOrganizationOnboardingForm() {
  const f = useCreateOrganizationOnboardingForm();

  if (f.statusLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin text-primary-orange" aria-hidden />
        Loading setup…
      </div>
    );
  }

  if (f.hasOrgMembership) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {CREATE_ORG_ONBOARDING_ALREADY_MEMBER_MESSAGE}
      </p>
    );
  }

  if (!f.pendingInvite) {
    return (
      <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
        <p>{CREATE_ORG_ONBOARDING_NO_INVITE_MESSAGE}</p>
        <Link href="/dashboard" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void f.submit(e)} className="space-y-4" aria-busy={f.loading}>
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {CREATE_ORG_ONBOARDING_TITLE}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {CREATE_ORG_ONBOARDING_DESCRIPTION}
        </p>
      </div>

      <div>
        <label htmlFor="onboarding-org-name" className="text-sm text-zinc-500">
          {CREATE_ORG_ONBOARDING_NAME_LABEL}
        </label>
        <input
          id="onboarding-org-name"
          className={`${CREATE_ORG_ONBOARDING_INPUT_CLASS} mt-1`}
          value={f.name}
          onChange={(e) => f.setName(e.target.value)}
          required
          disabled={f.loading}
          autoComplete="organization"
        />
      </div>

      <div>
        <label htmlFor="onboarding-org-slug" className="text-sm text-zinc-500">
          {CREATE_ORG_ONBOARDING_SLUG_LABEL}
        </label>
        <input
          id="onboarding-org-slug"
          className={`${CREATE_ORG_ONBOARDING_INPUT_CLASS} mt-1`}
          value={f.slug}
          onChange={(e) => {
            f.setSlugTouched(true);
            f.setSlug(e.target.value);
          }}
          disabled={f.loading}
          autoComplete="off"
        />
      </div>

      <button type="submit" disabled={f.loading} className={CREATE_ORG_ONBOARDING_SUBMIT_CLASS}>
        {f.loading ? CREATE_ORG_ONBOARDING_LOADING_LABEL : CREATE_ORG_ONBOARDING_SUBMIT_LABEL}
      </button>
    </form>
  );
}
