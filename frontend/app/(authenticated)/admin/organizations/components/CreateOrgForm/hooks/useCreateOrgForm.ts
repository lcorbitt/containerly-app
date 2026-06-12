"use client";

import { useState } from "react";
import { useToast } from "@/atoms/toast";
import { useCreateOrganizationMutation } from "@/hooks/mutations/useOrganization";

export function useCreateOrgForm(onCreated: (orgId: string) => Promise<void> | void) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [initialAdminEmail, setInitialAdminEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mutation = useCreateOrganizationMutation();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      const message = "Company name is required";
      setError(message);
      toast(message, "error");
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        name: trimmedName,
        slug: slug.trim() || null,
        initialAdminEmail: initialAdminEmail.trim() || null,
      });

      setName("");
      setSlug("");
      setInitialAdminEmail("");

      setRefreshing(true);
      try {
        await onCreated(result.id);
        toast(`Organization "${trimmedName}" created`, "success");
      } catch {
        toast("Organization created, but the list could not be refreshed. Reload the page.", "error");
      } finally {
        setRefreshing(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create organization";
      setError(message);
      toast(message, "error");
    }
  }

  return {
    name,
    setName,
    slug,
    setSlug,
    initialAdminEmail,
    setInitialAdminEmail,
    error,
    loading: mutation.isPending || refreshing,
    submit,
  };
}
