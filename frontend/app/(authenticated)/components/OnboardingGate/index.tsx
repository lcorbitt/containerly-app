"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboardingStatusQuery } from "@/hooks/queries/useOnboarding";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";

const EXEMPT_PATH_PREFIXES = ["/onboarding", "/admin", "/settings"];

interface OnboardingGateProps {
  children: React.ReactNode;
}

/** Redirects operators without an organization to finish sign-up step 2. */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSuperAdmin, orgs } = useOrganizationWorkspace();
  const statusQuery = useOnboardingStatusQuery(!isSuperAdmin);

  const hasOrgFromWorkspace = orgs.some((row) => row.organizations?.id != null);
  const hasOrgMembership = isSuperAdmin || hasOrgFromWorkspace || (statusQuery.data?.hasOrgMembership ?? false);

  const isExempt = EXEMPT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (isSuperAdmin || isExempt) return;
    if (statusQuery.isLoading && !hasOrgFromWorkspace) return;
    if (hasOrgMembership) return;
    router.replace("/signup?step=2");
  }, [
    isSuperAdmin,
    isExempt,
    statusQuery.isLoading,
    hasOrgFromWorkspace,
    hasOrgMembership,
    router,
  ]);

  return children;
}
