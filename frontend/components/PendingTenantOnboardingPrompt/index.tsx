"use client";

import Link from "next/link";
import { useOnboardingStatusQuery } from "@/hooks/queries/useOnboarding";

export function PendingTenantOnboardingPrompt() {
  const query = useOnboardingStatusQuery(true);
  const pending = query.data?.pendingTenantInvite;

  if (query.isLoading || !pending) return null;

  return (
    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
      Finish setting up your organization to get started.{" "}
      <Link
        href="/onboarding/create-organization"
        className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
      >
        Create Organization
      </Link>
    </p>
  );
}
