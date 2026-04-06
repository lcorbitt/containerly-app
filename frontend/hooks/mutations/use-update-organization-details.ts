import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrganizationNameAndSlugBrowser } from "@/services/organization-tenant.service";
import { orgMetricsRootKey } from "@/hooks/queries/use-organization-metrics";

export function useUpdateOrganizationDetailsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; name: string; slug: string }) =>
      updateOrganizationNameAndSlugBrowser(input.organizationId, input.name, input.slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgMetricsRootKey });
    },
  });
}
