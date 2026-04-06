import { useMutation } from "@tanstack/react-query";
import { createOrganization } from "@/services/organizations.service";

export function useCreateOrganizationMutation() {
  return useMutation({
    mutationFn: (input: { name: string; slug: string | null }) => createOrganization(input),
  });
}
