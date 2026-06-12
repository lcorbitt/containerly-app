"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/atoms/toast";
import { useCompleteOnboardingOrganizationMutation } from "@/hooks/mutations/useOnboarding";
import { useOnboardingStatusQuery } from "@/hooks/queries/useOnboarding";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { slugFromOrganizationName } from "@/utils/organization-slug";

export function useCreateOrganizationOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshOrgs } = useOrganizationWorkspace();
  const statusQuery = useOnboardingStatusQuery();
  const mutation = useCompleteOnboardingOrganizationMutation();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const pendingInvite = statusQuery.data?.pendingTenantInvite ?? null;
  const hasOrgMembership = statusQuery.data?.hasOrgMembership ?? false;

  useEffect(() => {
    if (!pendingInvite?.suggestedOrgName || name.trim() !== "") return;
    setName(pendingInvite.suggestedOrgName);
  }, [pendingInvite?.suggestedOrgName, name]);

  useEffect(() => {
    if (slugTouched) return;
    const next = slugFromOrganizationName(name);
    setSlug(next);
  }, [name, slugTouched]);

  useEffect(() => {
    if (!statusQuery.isSuccess) return;
    if (hasOrgMembership) {
      router.replace("/dashboard");
    }
  }, [statusQuery.isSuccess, hasOrgMembership, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim() || slugFromOrganizationName(trimmedName);
    if (!trimmedName) {
      toast("Company name is required.", "error");
      return;
    }

    try {
      await mutation.mutateAsync({ name: trimmedName, slug: trimmedSlug });
      await refreshOrgs();
      toast("Organization created", "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create organization", "error");
    }
  }

  return {
    name,
    setName,
    slug,
    setSlug,
    setSlugTouched,
    submit,
    loading: mutation.isPending,
    statusLoading: statusQuery.isLoading,
    hasOrgMembership,
    pendingInvite,
  };
}
