"use client";

import { useState } from "react";
import { useCreateOrganizationMutation } from "@/hooks/mutations/use-create-organization";

export function useCreateOrgForm(onCreated: (orgId: string) => void) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateOrganizationMutation();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await mutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || null,
      });
      onCreated(result.id);
      setName("");
      setSlug("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create organization");
    }
  }

  return {
    name,
    setName,
    slug,
    setSlug,
    error: error ?? (mutation.error instanceof Error ? mutation.error.message : null),
    loading: mutation.isPending,
    submit,
  };
}
