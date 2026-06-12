import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch, parseEdgeJson } from "@/lib/supabase/edge-functions";
import type { OrgPerformanceSettings } from "@shared/dto/performance.dto";

export async function fetchOrganizationPerformanceSettingsBrowser(
  organizationId: string,
): Promise<OrgPerformanceSettings> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const r = await parseEdgeJson<{ ok: true; settings: OrgPerformanceSettings }>(
    await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.organizations.performanceSettingsGet}?${params}`),
  );
  return r.settings;
}

export async function updateOrganizationPerformanceSettingsBrowser(input: {
  organizationId: string;
  settings: OrgPerformanceSettings;
}): Promise<OrgPerformanceSettings> {
  const r = await parseEdgeJson<{ ok: true; settings: OrgPerformanceSettings }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.organizations.performanceSettingsUpdate, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: input.organizationId,
        ...input.settings,
      }),
    }),
  );
  return r.settings;
}
